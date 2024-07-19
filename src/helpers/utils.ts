import * as bitcoin from 'bitcoinjs-lib'
import {HDNode, privateKeyToWIF, hdFromXprv} from '@noonewallet/crypto-core-ts'
import {xpubConverter} from '@noonewallet/crypto-core-ts/dist/utils/xpub-converter'
import {networks, NetworkType} from '@helpers/networks'
import CustomError from '@helpers/error/custom-error'
import {
  CurrencyType,
  ICoinCore,
  IDecodeOutput,
  IUTXO,
  IDecodeInput,
  IDecodedTx,
} from '@helpers/types'
import * as currencies from '@helpers/currencies'
import {getBchAddressByNode, getBchAddressByPublicKey} from '@coins/BCH/utils'

export {getBchAddressByNode, getBchAddressByPublicKey}
/**
 * Getting a bitcoin address by node and child index
 * @param {Object} node - HDkey node
 * @param {number} childIndex - Index of the child node
 * @param {string} type - Bitcoin type. There may be p2pkh or p2wpkh
 * @param {string} network - Custom network for different coins
 * @returns {string} Bitcoin address
 */

// TODO: string | undefined
export const getAddressByNode = (
  node: HDNode,
  childIndex = 0,
  type: CurrencyType = 'p2pkh',
  network: NetworkType = 'btc',
): string => {
  try {
    const pubKey = node.deriveChild(childIndex).publicKey
    const coinNetwork = networks[network]
    const address = bitcoin.payments[type]({
      pubkey: pubKey,
      network: coinNetwork,
    }).address

    return address || ''
  } catch (e) {
    console.log(e)
    throw new CustomError('err_core_bch_address')
  }
}

/**
 * Getting Bitcoin private key for address by derivation index
 * @param {Object} node - Input data for a transaction
 * @param {number} index - Derivation index
 * @returns {string} Returns Private key in WIF format
 */

export function getPrivateKeyByIndex(node: HDNode, index: number) {
  try {
    const key = node.deriveChild(index).privateKey

    return privateKeyToWIF(key)
  } catch (e) {
    throw new CustomError('err_btc_private_key_by_index')
  }
}

/**
 * Getting an address by public key
 * @param {Buffer} pubKey - Coin public key
 * @param {string} type - Bitcoin type
 * @param {string} network - Custom network for different coins
 * @returns {string} Bitcoin address
 */

// TODO: string | void
export const getAddressByPublicKey = (
  pubKey: string | Buffer,
  type: CurrencyType = 'p2pkh',
  network: NetworkType = 'btc',
): string | undefined => {
  try {
    let keyInBuffer
    if (typeof pubKey === 'string') {
      keyInBuffer = new Buffer(pubKey, 'hex')
    } else {
      keyInBuffer = pubKey
    }
    const payment = bitcoin.payments[type]({
      pubkey: keyInBuffer,
      network: networks[network],
    })
    return payment.address
  } catch (e) {
    console.log(e)
    throw new CustomError('err_core_public_key')
  }
}

const getCurrencyName = (shortName = 'BTC', type: CurrencyType) => {
  if (shortName.toUpperCase() === 'BTC') {
    if (type.toLowerCase() === 'p2wpkh') {
      return 'BTC_SEGWIT'
    } else return 'BTC'
  } else return shortName.toUpperCase()
}

export const getBtcBasedCore = (
  node: HDNode,
  shortName = 'BTC',
  type: CurrencyType,
): ICoinCore => {
  const currencyName = getCurrencyName(shortName, type)

  if (!(currencyName in currencies)) {
    throw new CustomError('err_core_currency')
  }
  // @ts-ignore
  const currency = currencies[currencyName]
  const path = {
    external: currency.path + '/0',
    internal: currency.path + '/1',
  }

  const externalNode = node.derive(path.external)
  const internalNode = node.derive(path.internal)
  const pkPrefix = currency.pubKeyPrefix
  const externalPubKey =
    pkPrefix !== 'xpub'
      ? xpubConverter(externalNode.publicExtendedKey, pkPrefix)
      : externalNode.publicExtendedKey
  const internalPubKey =
    pkPrefix !== 'xpub'
      ? xpubConverter(internalNode.publicExtendedKey, pkPrefix)
      : internalNode.publicExtendedKey

  const res: ICoinCore = {
    externalNode: externalNode.privateExtendedKey,
    externalPubKey: externalPubKey,
    internalNode: internalNode.privateExtendedKey,
    internalPubKey: internalPubKey,
    externalAddress: '',
    internalAddress: '',
  }

  if (currencyName !== 'BCH') {
    res.externalAddress = getAddressByNode(
      externalNode,
      0,
      currency.type,
      currency.network,
    )
    res.internalAddress = getAddressByNode(
      internalNode,
      0,
      currency.type,
      currency.network,
    )
  } else {
    res.externalAddress = getBchAddressByNode(externalNode, 0)
    res.internalAddress = getBchAddressByNode(internalNode, 0)
  }

  return res
}

interface ICoreInputData {
  xprv: string
  coin: string
  type: CurrencyType
  pathType: number
  from: number
  to: number
}

interface IChildNode {
  path: string
  privateKey: string
  publicKey: string
  address: string | undefined
  index: number
}
export const createCoreWithAddresses = (data: ICoreInputData) => {
  const {coin, type, from, to, xprv, pathType} = data
  const currencyName = getCurrencyName(coin, type)

  if (!(currencyName in currencies)) {
    throw new CustomError('err_core_currency')
  }
  // @ts-ignore
  const currency = currencies[currencyName]

  if (!xprv) {
    throw Error('xprv is undefined')
  }

  const path = currency.path + '/' + pathType
  let walletNode: HDNode | null = hdFromXprv(xprv)
  let node: HDNode | null = walletNode.derive(path)
  const childList: IChildNode[] = []

  let addressFn
  if (coin === 'BCH') {
    addressFn = (pubkey: string) => getBchAddressByPublicKey(pubkey)
  } else {
    addressFn = (pubkey: string) =>
      getAddressByPublicKey(pubkey, type, currency.network)
  }
  for (let i = from; i <= to; i++) {
    const child: IChildNode = {
      path: '',
      privateKey: '',
      publicKey: '',
      address: '',
      index: i,
    }
    const deriveChild = node.deriveChild(i)
    child.path = `${path}/${i}`
    child.privateKey = deriveChild.privateKey.toString('hex')
    const publicKey = deriveChild.publicKey
    child.publicKey = publicKey.toString('hex')
    child.address = addressFn(child.publicKey)
    childList.push(child)
  }

  const info = {
    node: {
      privateExtendedKey: node.privateExtendedKey,
      publicExtendedKey: node.publicExtendedKey,
    },
    list: childList,
  }
  walletNode = node = null

  return info
}

export const getKeysAndAddressByNode = (
  node: HDNode,
  index = 0,
  type: CurrencyType = 'p2pkh',
  network: NetworkType = 'btc',
) => {
  try {
    const childNode = node.deriveChild(index)
    const publicKey = childNode.publicKey
    const address = getAddressByPublicKey(publicKey, type, network)
    const privateKey = childNode.privateKey

    return {
      privateKey: privateKeyToWIF(privateKey),
      publicKey: publicKey.toString('hex'),
      address,
    }
  } catch (e) {
    // TODO: error
    throw new CustomError('err_btc_private_key_by_index')
  }
}

export function getBtcPrivateKeyByIndex(node: HDNode, index: number): string {
  try {
    const key = node.deriveChild(index).privateKey

    return privateKeyToWIF(key)
  } catch (e) {
    throw new CustomError('err_btc_private_key_by_index')
  }
}

/**
 * Calculating the transaction size by the number of inputs and outputs
 * @param {number} i - Number of inputs. By default 1
 * @param {number} o - Number of outputs. By default 2
 * @param {boolean} isWitness - Flag signaling that there is a witness in the transaction
 * @returns {number} Transaction size
 */

export function calcTxSize(i = 1, o = 2, isWitness = false): number {
  let result

  if (isWitness) {
    const base_size = 41 * i + 32 * o + 10
    const total_size = 149 * i + 32 * o + 12

    result = (3 * base_size + total_size) / 4
  } else {
    result = i * 148 + o * 34 + 10
  }

  return Math.ceil(result)
}

/**
 * Function decodes the raw transaction to get inputs and outputs details using
 * @param {string} rawTx - raw transaction
 * @param {arrey} utxoSet - utxo set
 * @returns {Object} inputs and outputs of transactions
 */

export function decodeRawTransaction(
  rawTx: string,
  utxoSet: IUTXO[],
  inputsWithRawTx: IUTXO[],
): IDecodedTx {
  const tx = bitcoin.Transaction.fromHex(rawTx)
  const inputs: IDecodeInput[] = tx.ins.map((input, index) => {
    const prevTxId = Buffer.from(input.hash).reverse().toString('hex')
    const utxo = utxoSet[index]
    const utxoWithRawTx = inputsWithRawTx[index]

    if (!utxo) {
      throw new Error(
        `UTXO not found for txId: ${prevTxId}, index: ${input.index}`,
      )
    }

    return {
      sequence: input.sequence,
      witness: input.witness.length
        ? input.witness.map((w) => w.toString('hex')).join(' ')
        : '',
      script: input.script.toString('hex'),
      index: index,
      prev_out: {
        type: 0, // Assuming type 0
        spent: true,
        value: utxo.value,
        spending_outpoints: [{tx_index: 0, n: input.index}],
        n: input.index,
        addr: utxo.address,
        tx_index: 0,
        script: utxo.scriptPubKey,
        node_type: utxoWithRawTx?.node_type || 'internal',
        derive_index: utxoWithRawTx?.derive_index || 0,
        tx: utxoWithRawTx?.tx || '',
        transaction_hash: utxoWithRawTx?.transaction_hash || '',
      },
    }
  })

  const outputs: IDecodeOutput[] = tx.outs.map((output, index) => ({
    type: 0, // Assuming type 0
    spent: false,
    value: output.value,
    spending_outpoints: [],
    n: index,
    addr: bitcoin.address.fromOutputScript(
      output.script,
      bitcoin.networks.bitcoin,
    ),
    tx_index: 0,
    script: output.script.toString('hex'),
  }))

  return {inputs, outputs, locktime: tx.locktime}
}
