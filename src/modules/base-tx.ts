import {hdFromXprv, HDNode} from '@noonewallet/crypto-core-ts'
import converter from '@helpers/converters'
import {calcTxSize} from '@helpers/utils'
import {
  CurrencyType,
  IUnspent,
  IFeeSync,
  IFeeTx,
  ITxData,
  IFeeInputScope,
  FeeId,
} from '@helpers/types'

export const FeeIds: FeeId[] = ['fast', 'medium', 'custom']

export class BaseTx {
  public nodes: {
    internal: HDNode
    external: HDNode
  }
  private unspent: IUnspent[]
  protected balance: number
  protected feeIds: FeeId[]
  protected fees: IFeeSync[]
  protected feeList: IFeeTx[]
  protected type: CurrencyType
  protected dust: number

  constructor(data: ITxData) {
    this.unspent = data.unspent
    this.balance = this.unspent.reduce((a, b) => a + b.value, 0)
    this.nodes = {
      internal: hdFromXprv(data.nodes.internal),
      external: hdFromXprv(data.nodes.external),
    }
    this.feeIds = FeeIds
    this.fees = data.feeList
    this.feeList = []
    this.type = data.type
    this.dust = 1000
  }

  async calcFee(
    amount = 0,
    customFee = 0,
    sendAll = false,
    isReplacement = false,
    originalTx = {},
  ): Promise<IFeeTx[]> {
    const fees: number[] = []
    let amountInSat = 0

    if (!sendAll) {
      amountInSat = converter.btc_to_sat(amount)
    } else {
      amountInSat = this.balance
    }
    for (const item of this.fees) {
      fees.push(+item.feePerByte)
    }
    fees.push(+customFee)

    if (amountInSat <= 0 || this.balance < amountInSat) {
      return this.calcEmptyFee(fees)
    }

    const pArray = fees.map(async (fee) => {
      if (isReplacement) {
        return this.getReplaceInputs(fee, amountInSat, originalTx)
      } else if (sendAll) {
        return this.getSendAllInputs(fee, amountInSat)
      } else {
        return await this.getInputs(fee, amountInSat)
      }
    })

    const res = await Promise.all(pArray)

    this.feeList = res.map((item: IFeeInputScope, i) => {
      const fee: IFeeTx = {
        id: this.feeIds[i],
        value: item.fee,
        coinValue: +converter.sat_to_btc(item.fee),
        feePerByte: fees[i],
        inputs: item.inputs,
        inputsAmount: item.inputsAmount,
        custom: this.feeIds[i] === 'custom',
      }
      return fee
    })
    return this.feeList
  }

  calcEmptyFee(fees: number[]): IFeeTx[] {
    this.feeList = fees.map((item, i) => {
      return {
        id: this.feeIds[i],
        value: 0,
        coinValue: 0,
        feePerByte: item,
        inputs: [],
        inputsAmount: 0,
        custom: this.feeIds[i] === 'custom',
      }
    })

    return this.feeList
  }

  getSendAllInputs(fee: number, balance: number): IFeeInputScope {
    const size = calcTxSize(this.unspent.length, 1, this.type === 'p2wpkh')
    const calcFee = fee * size
    const amount = balance - calcFee

    if (amount >= 0) {
      return {
        fee: calcFee,
        inputs: this.unspent,
        inputsAmount: balance,
      }
    } else {
      return {
        fee: 0,
        inputs: [],
        inputsAmount: 0,
      }
    }
  }

  async getInputs(fee: number, amount: number): Promise<IFeeInputScope> {
    if (!fee) {
      return {
        fee: 0,
        inputs: [],
        inputsAmount: 0,
      }
    }
    let index = 0
    let inputsAmount = 0
    const inputs: IUnspent[] = []
    let res: IFeeInputScope = {
      fee: 0,
      inputs: [],
      inputsAmount: 0,
    }

    this.dust = 1000

    const req = async () => {
      const item: IUnspent = this.unspent[index]
      const defaultSize = calcTxSize(index + 1, 2, this.type === 'p2wpkh')
      const calcFee = defaultSize * fee

      inputsAmount += item.value
      inputs.push(item)

      const total = amount + calcFee + this.dust

      if (total > inputsAmount) {
        index++

        if (index >= this.unspent.length) {
          res = {
            fee: 0,
            inputs: [],
            inputsAmount: 0,
          }
        } else {
          await req()
        }
      } else {
        res = {
          fee: calcFee,
          inputs: inputs,
          inputsAmount: inputsAmount,
        }
      }
    }
    await req()

    return res
  }

  async getReplaceInputs(
    fee: number,
    amount: number,
    originalTx: any,
  ): Promise<IFeeInputScope> {
    if (!fee) {
      return {
        fee: 0,
        inputs: [],
        inputsAmount: 0,
      }
    }

    let inputsAmount = 0
    const inputs: IUnspent[] = []
    let res: IFeeInputScope = {
      fee: 0,
      inputs: [],
      inputsAmount: 0,
    }
    const calculateFee = (numInputs: number, numOutputs: number): number => {
      const size = calcTxSize(numInputs, numOutputs, this.type === 'p2wpkh')
      return size * fee
    }
    for (const input of originalTx.inputs) {
      const newInput: IUnspent = {
        derive_index: input.prev_out?.derive_index || 0,
        block_id: 0,
        transaction_hash: input.prev_out.transaction_hash || '',
        index: input.prev_out.n,
        value: input.prev_out.value,
        address: input.prev_out.addr,
        tx: input.prev_out.tx,
        node_type: input.prev_out.node_type || 'internal',
        sequence: input.sequence + 1 || 1,
      }
      inputs.push(newInput)
      inputsAmount += input.prev_out.value
    }

    let calcFee = calculateFee(inputs.length, 2)
    let totalRequired = amount + calcFee + this.dust

    let index = 0
    while (inputsAmount < totalRequired && index < this.unspent.length) {
      const item = this.unspent[index]
      if (item.block_id !== -1) {
        inputs.push(item)
        inputsAmount += item.value

        // Recalculate the total required after adding the new input
        calcFee = calculateFee(inputs.length, 2)
        totalRequired = amount + calcFee + this.dust
      }
      index++
    }

    // Final fee calculation after adding all necessary inputs
    calcFee = calculateFee(inputs.length, 2)
    totalRequired = amount + calcFee + this.dust

    // Ensure the total input amount covers the outputs and fee
    if (inputsAmount < totalRequired) {
      return {
        fee: 0,
        inputs: [],
        inputsAmount: 0,
      }
    }

    res = {
      fee: calcFee,
      inputs: inputs,
      inputsAmount: inputsAmount,
    }

    return res
  }
}
