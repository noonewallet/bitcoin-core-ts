import {makeRawTx} from '@modules/transaction'
import {BaseTx} from '@modules/base-tx'
import converter from '@helpers/converters'
import {getBtcPrivateKeyByIndex} from '@helpers/utils'
import CustomError from '@helpers/error/custom-error'
import {IInput, IOutput, IRawTxData, ITxData} from '@helpers/types'
import {networks} from '@helpers/networks'
import {Network} from 'bitcoinjs-lib'
import {LTC, ICurrency} from '@helpers/currencies'

/**
 * Class LitecoinTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Litecoin transaction
 * @class
 */

export class LtcTx extends BaseTx {
  private txOptions: {maximumFeeRate: number; network: Network}
  private currency: ICurrency

  /**
   * Create a LitecoinTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {Array} data.feeList - Set of rawLitecoin fees
   * @param {Object} data.nodes - External and internal Litecoin nodes
   */
  constructor(data: ITxData) {
    super(data)
    this.feeIds = ['optimal', 'custom']
    this.currency = LTC
    this.type = LTC.type
    this.txOptions = {network: networks.ltc, maximumFeeRate: 2000000}
  }

  /**
   * Creating a Litecoin transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.addressTo - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
   * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
   */

  async make(data: IRawTxData) {
    const {address, amount, fee, changeAddress} = data

    if (!amount) {
      throw new CustomError('err_tx_ltc_amount')
    }

    if (isNaN(fee.value)) {
      throw new CustomError('err_tx_ltc_fee')
    }

    const amountInSat = converter.btc_to_sat(amount)
    const change = fee.inputsAmount - amountInSat - fee.value
    const inputs: IInput[] = []
    const outputs: IOutput[] = []

    if (change < 0) {
      throw new CustomError('err_tx_ltc_balance')
    }

    for (const utxo of fee.inputs) {
      const item: IInput = {
        hash: utxo.transaction_hash,
        index: utxo.index,
        address: utxo.address,
        value: utxo.value,
        key: getBtcPrivateKeyByIndex(
          this.nodes[utxo.node_type],
          utxo.derive_index,
        ),
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

    return makeRawTx(inputs, outputs, this.currency, this.txOptions)
  }
}
