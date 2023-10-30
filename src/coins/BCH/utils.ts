import * as bchaddr from 'bchaddrjs'
import * as bitcore from 'bitcore-lib-cash'
import CustomError from '@helpers/error/custom-error'
import {HDNode} from '@noonewallet/crypto-core-ts'
import {Address, IInput, IOutput} from '@helpers/types'
import {BCH} from '@helpers/currencies'

/**
 * Getting Bitcoin Cash address by node and derivation index
 * @param {Object} node - Input data for a transaction
 * @param {number} childIndex - Derivation index
 * @param {boolean} withoutPrefix - Flag for prefix
 * @returns {string} Returns address
 */

const addressPrefix = 'bitcoincash:'

const removeAddressPrefix = (address: string): string => {
  if (!address) return ''
  return address.split(addressPrefix)[1]
}

export const getBchAddressByNode = (
  node: HDNode,
  childIndex: number,
  withPrefix?: boolean,
): Address => {
  try {
    const pubKey = node.deriveChild(childIndex).pubKeyHash
    const address = bitcore.Address.fromPublicKeyHash(pubKey, BCH.network)
    const finalAddress = address.toCashAddress()
    if (withPrefix) return finalAddress
    return removeAddressPrefix(finalAddress)
  } catch (e) {
    console.log(e)
    throw new CustomError('err_core_bch_address')
  }
}

// export const getBchCore = (node: HDNode): ICoinCore => {
//   const path = {
//     external: BCH.path + '/0',
//     internal: BCH.path + '/1',
//   }
//
//   const externalNode = node.derive(path.external)
//   const internalNode = node.derive(path.internal)
//
//   const res: ICoinCore = {
//     externalNode: externalNode.privateExtendedKey,
//     internalNode: internalNode.privateExtendedKey,
//     externalAddress: '',
//     internalAddress: '',
//   }
//
//   res.externalAddress = getBchAddressByNode(externalNode, 0)
//   res.internalAddress = getBchAddressByNode(internalNode, 0)
//
//   return res
// }

export function getBchAddressByPublicKey(
  pubKey: string,
  withPrefix?: boolean,
): Address {
  if (!pubKey) return ''

  try {
    const bitcorePubKey = new bitcore.PublicKey(pubKey)
    const address = bitcore.Address.fromPublicKey(bitcorePubKey, BCH.network)
    const finalAddress = address.toCashAddress()
    if (withPrefix) return finalAddress
    return removeAddressPrefix(finalAddress)
  } catch (e) {
    console.log(e)
    throw new CustomError('err_core_bch_address')
  }
}

/**
 * Convert a Bitcoin Cash address from Legacy format to CashAddr format
 * @param {string} address - Bitcoin Cash address in Legacy format
 * @param {boolean} withPrefix
 * @returns {string} Returns Bitcoin Cash address in CashAddr format
 */

export function convertToCashAddress(
  address: string,
  // withPrefix?: boolean,
): string {
  try {
    const toCashAddress = bchaddr.toCashAddress

    return toCashAddress(address)
  } catch (e) {
    console.log(e)
    throw new CustomError('err_get_bch_address')
  }
}

/**
 * Creating a raw Bitcoin Cash transaction
 * @param {Array} inputs - List of inputs
 * @param {Array} outputs - List of outputs
 * @returns {Object} Returns raw Bitcoin Cash transaction and transaction hash
 */

export function makeRawBchTx(inputs: IInput[], outputs: IOutput[]) {
  try {
    const privateKeys = []
    const utxos = []

    for (const input of inputs) {
      const convertedAddress = convertToCashAddress(input.address)
      const Address = bitcore.Address.fromString(convertedAddress, BCH.network)
      const script = bitcore.Script.fromAddress(Address)
      const output = bitcore.Transaction.UnspentOutput.fromObject({
        outputIndex: +input.index,
        satoshis: +input.value,
        txId: input.hash,
        address: convertedAddress,
        script,
      })
      const pk = new bitcore.PrivateKey(input.key)
      privateKeys.push(pk)
      utxos.push(output)
    }

    const tx = new bitcore.Transaction().from(utxos)

    for (const output of outputs) {
      const convertedAddress = convertToCashAddress(output.address)
      tx.to(convertedAddress, +output.value)
    }
    tx.sign(privateKeys)

    const txData = tx.serialize()
    return {
      tx: txData.toString(),
      hash: tx.hash,
    }
  } catch (e) {
    console.log(e)
    throw new CustomError('err_tx_bch_build')
  }
}
