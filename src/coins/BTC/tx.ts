import {makeRawTx} from '@modules/transaction'
import {BaseTx} from '@modules/base-tx'
import converter from '@helpers/converters'
import {getBtcPrivateKeyByIndex} from '@helpers/utils'
import CustomError from '@helpers/error/custom-error'

import {
  // CurrencyType,
  IInput,
  IOutput,
  IRawTxData,
  IRawTxResponse,
  ITxData,
  IUnspent,
} from '@helpers/types'

// @ts-ignore
// import {CoinsNetwork} from '@noonewallet/network-js'
import {BTC, BTC_SEGWIT, ICurrency} from '@helpers/currencies'
// const request = CoinsNetwork.btc

/**
 * Class BitcoinTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Bitcoin transaction
 * @class
 */

export class BtcTx extends BaseTx {
  private currency: ICurrency

  /**
   * Create a BitcoinTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {Array} data.feeList - Set of bitcoin fees
   * @param {Object} data.nodes - External and internal nodes required to generate private keys
   * @param {String} data.type - Bitcoin type. There may be p2pkh or p2wpkh
   */

  constructor(data: ITxData) {
    super(data)
    // this.feeIds = FeeIds
    this.type = data.type || 'p2pkh'
    this.currency = this.type === 'p2pkh' ? BTC : BTC_SEGWIT
  }

  async make(data: IRawTxData) {
    const {address, fee, amount, changeAddress} = data

    if (!amount) {
      throw new CustomError('err_tx_btc_amount')
    }

    if (isNaN(fee.value)) {
      throw new CustomError('err_tx_btc_fee')
    }

    const amountInSat = converter.btc_to_sat(amount)
    const change = fee.inputsAmount - amountInSat - fee.value
    let inputs: IInput[] = []
    const outputs: IOutput[] = []

    if (change < 0) {
      throw new CustomError('err_tx_btc_balance')
    }
    const res = await this.getInputsWithTxInfo(fee.inputs)
    if (res) inputs = res
    else {
      throw new CustomError('err_tx_btc_inputs')
    }

    outputs.push({
      address,
      value: amountInSat,
    })

    if (change) {
      outputs.push({
        address: changeAddress,
        value: change,
      })
    }

    return makeRawTx(inputs, outputs, this.currency)
  }

  /**
   * Returns the required data to create a transaction
   * @param {Array} inputs - Array of inputs for tx
   * @returns {Promise<Array>} Returns an array of inputs with a private keys and raw transaction data for p2pkh items
   */

  async getInputsWithTxInfo(inputs: IUnspent[]): Promise<IInput[] | undefined> {
    try {
      let rawTxsData: any[] = []
      const finalInputs: IInput[] = []

      if (this.type === 'p2pkh') {
        const hashes = []

        for (const input of inputs) {
          if (!input.tx) {
            if (input.transaction_hash) {
              hashes.push(input.transaction_hash)
            } else {
              throw new CustomError('err_tx_btc_unspent')
            }
          }
        }
        const unique_hashes = [...new Set(hashes)]

        // rawTxsData = await request.getRawTx(unique_hashes)
        rawTxsData = []

        for (const input of inputs) {
          const item: IInput = {
            hash: input.transaction_hash,
            index: input.index,
            address: input.address,
            value: input.value,
            key: '',
          }
          if (!input.tx) {
            const data = rawTxsData.find(
              (item: IRawTxResponse) => item.hash === input.transaction_hash,
            )
            item.tx = data ? data.rawData : null
          } else {
            item.tx = input.tx
          }
          item.key =
            input.key ||
            getBtcPrivateKeyByIndex(
              this.nodes[input.node_type],
              input.derive_index,
            )

          finalInputs.push(item)
        }
      } else {
        for (const input of inputs) {
          const item: IInput = {
            hash: input.transaction_hash,
            index: input.index,
            address: input.address,
            value: input.value,
            key:
              input.key ||
              getBtcPrivateKeyByIndex(
                this.nodes[input.node_type],
                input.derive_index,
              ),
          }

          finalInputs.push(item)
        }
      }

      return finalInputs
    } catch (e) {
      if (e instanceof Error) {
        throw new Error(e.message)
      } else {
        console.log('Unexpected error', e)
      }
    }
  }
}
