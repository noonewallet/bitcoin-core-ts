import {makeRawTx} from '@modules/transaction'
import {BaseTx} from '@modules/base-tx'
import converter from '@helpers/converters'
import {getBtcPrivateKeyByIndex} from '@helpers/utils'
import CustomError from '@helpers/error/custom-error'
import {
  IHeader,
  IInput,
  IOutput,
  IRawTxData,
  IRawTxResponse,
  ITxData,
} from '@helpers/types'
import {networks} from '@helpers/networks'
// @ts-ignore
import {CoinsNetwork} from '@noonewallet/network-js'
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
  private headers: IHeader | undefined
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
    this.headers = data?.headers
    this.feeIds = ['optimal', 'custom']
    this.currency = DOGE
    this.type = DOGE.type
    this.txOptions = {network: networks.doge, maximumFeeRate: 2000000}
    this.reqHandler = CoinsNetwork.doge
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
    const hashes = []

    if (change < 0) {
      throw new CustomError('err_tx_doge_balance')
    }

    for (const input of fee.inputs) {
      if (!input.tx) {
        if (input.transaction_hash) {
          hashes.push(input.transaction_hash)
        } else {
          throw new CustomError('err_tx_btc_unspent')
        }
      }
    }

    const unique_hashes = [...new Set(hashes)]
    const rawTxsData = await this.reqHandler.getRawTx(
      unique_hashes,
      this.headers,
    )

    for (const utxo of fee.inputs) {
      hashes.push(utxo.transaction_hash)

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
      const data = rawTxsData.find(
        (item: IRawTxResponse) => item.hash === utxo.transaction_hash,
      )
      if (!utxo.tx) {
        item.tx = data ? data.rawData : null
      } else {
        item.tx = utxo.tx
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
