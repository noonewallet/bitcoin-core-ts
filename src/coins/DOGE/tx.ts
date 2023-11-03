import {makeRawTx} from '@modules/transaction'
import {BaseTx} from '@modules/base-tx'
import converter from '@helpers/converters'
import {getBtcPrivateKeyByIndex} from '@helpers/utils'
import CustomError from '@helpers/error/custom-error'
import {IInput, IOutput, IRawTxData, ITxData} from '@helpers/types'
import {networks} from '@helpers/networks'
import {Network} from 'bitcoinjs-lib'
import {DOGE, ICurrency} from '@helpers/currencies'

// const request = CoinsNetwork.doge

/**
 * Class DogecoinTx.
 * This class is responsible for calculating the fee,
 * calculating the available amount to send, and generating and signing a Dogecoin transaction
 * @class
 */

export class DogeTx extends BaseTx {
  private txOptions: {maximumFeeRate: number; network: Network}
  private currency: ICurrency
  private reqHandler: any

  /**
   * Create a DogecoinTx
   * @param {Object} data - Input data for generating a transaction, calculating a fee or available amount
   * @param {Array} data.unspent - Array of unspent addresses
   * @param {Array} data.feeList - Set of rawDogecoin fees
   * @param {Object} data.nodes - External and internal Dogecoin nodes
   */
  constructor(data: ITxData) {
    super(data)
    this.feeIds = ['optimal', 'custom']
    this.currency = DOGE
    this.type = DOGE.type
    this.txOptions = {network: networks.doge, maximumFeeRate: 2000000}
  }

  /**
   * Creating a Dogecoin transaction
   * @param {Object} data - Input data for a transaction
   * @param {string} data.address - Recipient address
   * @param {Object} data.fee - The transaction fee and list of inputs
   * @returns {Promise<Object>} Returns the raw transaction and transaction hash if sent successfully
   */

  async make(data: IRawTxData) {
    const {address, amount, fee, changeAddress} = data

    if (!amount) {
      throw new CustomError('err_tx_doge_amount')
    }

    if (isNaN(fee.value)) {
      throw new CustomError('err_tx_doge_fee')
    }

    const amountInSat = converter.btc_to_sat(amount)
    const change = fee.inputsAmount - amountInSat - fee.value
    const inputs: IInput[] = []
    const outputs: IOutput[] = []

    if (change < 0) {
      throw new CustomError('err_tx_doge_balance')
    }

    for (const utxo of fee.inputs) {
      const item: IInput = {
        hash: utxo.transaction_hash,
        index: utxo.index,
        address: utxo.address,
        value: utxo.value,
        tx: utxo.tx,
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

    if (change) {
      outputs.push({
        address: changeAddress,
        value: change,
      })
    }

    return makeRawTx(inputs, outputs, this.currency, this.txOptions)
  }
}
