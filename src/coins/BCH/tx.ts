import {BaseTx} from '@modules/base-tx'
import converter from '@helpers/converters'
import {getBtcPrivateKeyByIndex} from '@helpers/utils'
import {IHeader, IInput, IOutput, IRawTxData, ITxData} from '@helpers/types'
import {BCH, ICurrency} from '@helpers/currencies'
import CustomError from '@helpers/error/custom-error'
import {makeRawBchTx} from '@coins/BCH/utils'

/**
 * Class BitcoinCashTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Bitcoin Cash transaction
 * @class
 */

export class BchTx extends BaseTx {
  /**
   * Create a BitcoinCashTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {number} data.balance - Bitcoin Cash wallet balance
   * @param {Array} data.feeList - Set of raw Bitcoin Cash fees
   * @param {Object} data.nodes - External and internal Bitcoin Cash nodes
   */
  private headers: IHeader | undefined
  private currency: ICurrency

  constructor(data: ITxData) {
    super(data)
    this.headers = data?.headers
    this.feeIds = ['optimal', 'custom']
    this.currency = BCH
    this.type = BCH.type
  }

  /**
   * Creating a Bitcoin Cash transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.address - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
   * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
   */

  async make(data: IRawTxData) {
    const {address, amount, fee, changeAddress} = data

    if (!amount) {
      throw new CustomError('err_tx_bch_amount')
    }

    if (isNaN(fee.value)) {
      throw new CustomError('err_tx_bch_fee')
    }

    const amountInSat = converter.btc_to_sat(amount)
    const change = fee.inputsAmount - amountInSat - fee.value
    const inputs: IInput[] = []
    const outputs: IOutput[] = []

    if (change < 0) {
      throw new CustomError('err_tx_bch_balance')
    }

    for (const utxo of fee.inputs) {
      const key = getBtcPrivateKeyByIndex(
        this.nodes[utxo.node_type],
        utxo.derive_index,
      )
      const item = {
        hash: utxo.transaction_hash,
        index: utxo.index,
        address: utxo.address,
        value: utxo.value,
        key,
      }

      inputs.push(item)
    }

    outputs.push({
      address,
      value: amountInSat,
    })

    if (change !== 0) {
      outputs.push({
        address: changeAddress,
        value: change,
      })
    }

    return makeRawBchTx(inputs, outputs)
  }
}
