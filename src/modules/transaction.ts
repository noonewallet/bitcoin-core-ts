import * as bitcoin from 'bitcoinjs-lib'
import {ECPairFactory, TinySecp256k1Interface, ECPairAPI} from 'ecpair'
import CustomError from '@helpers/error/custom-error'
import {IInput, IOutput, IInputForSign, ITxOptions} from '@helpers/types'
import {ICurrency} from '@helpers/currencies'
import {networks} from '@helpers/networks'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const tinysecp: TinySecp256k1Interface = require('tiny-secp256k1')

/**
 * Creating a raw Bitcoin transaction
 * @param {Array} inputs - List of inputs
 * @param {Array} outputs - List of outputs
 * @param txOptions
 * @param {Object} currency
 * @returns {Object} Returns raw Bitcoin transaction and transaction hash
 */

export function makeRawTx(
  inputs: IInput[],
  outputs: IOutput[],
  currency: ICurrency,
  txOptions?: ITxOptions,
) {
  try {
    const network = networks[currency.network]
    const isSegwit = currency.type === 'p2wpkh'
    const psbt = new bitcoin.Psbt(txOptions)
    const keyPairs: any[] = []
    const ECPair = ECPairFactory(tinysecp)
    psbt.setVersion(1)

    for (const [i, input] of inputs.entries()) {
      // TODO check btc segwit
      // const isAddressSegwit = input.address.substring(0, 3) === 'bc1'
      const keyPair = ECPair.fromWIF(input.key)
      keyPair.network = network
      keyPairs.push(keyPair)

      const data: IInputForSign = {
        hash: input.hash,
        index: input.index,
        sequence: input.sequence,
      }

      if (isSegwit) {
        const p2wpkh = bitcoin.payments.p2wpkh({
          pubkey: keyPair.publicKey,
          network,
        })
        const script = p2wpkh.output?.toString('hex')

        if (!script) {
          throw new CustomError('err_tx_btc_script')
        }
        data.witnessUtxo = {
          script: Buffer.from(script, 'hex'),
          value: input.value,
        }
      } else {
        if (input.tx) {
          data.nonWitnessUtxo = Buffer.from(input.tx, 'hex')
        }
      }

      try {
        // Fallback for Doge
        psbt.addInput(data)
      } catch (e) {
        if (
          e instanceof Error &&
          e.message === 'RangeError: value out of range'
        ) {
          delete psbt.data.inputs[i].nonWitnessUtxo
          const p2pkh = bitcoin.payments.p2pkh({
            pubkey: keyPair.publicKey,
            network,
          })
          // @ts-ignore
          const script = p2pkh.output.toString('hex')

          psbt.updateInput(i, {
            witnessUtxo: {
              script: Buffer.from(script, 'hex'),
              value: input.value,
            },
          })
          // @ts-ignore
          psbt.__CACHE.__UNSAFE_SIGN_NONSEGWIT = true
        } else {
          console.error('addInput error', e)
          // throw new CustomError(e.message)
        }
      }
    }

    outputs.forEach((output) => {
      psbt.addOutput({
        address: output.address,
        value: output.value,
      })
    })

    keyPairs.forEach((key, i) => {
      psbt.signInput(i, key)
    })

    psbt.validateSignaturesOfAllInputs(validator)
    psbt.finalizeAllInputs()

    const transaction = psbt.extractTransaction()
    const signedTransaction = transaction.toHex()
    const hash = transaction.getId()
    return {
      hash,
      tx: signedTransaction,
      inputs,
      outputs,
    }
  } catch (e) {
    console.log(e)
    throw new CustomError('err_tx_btc_build')
  }
}

const validator = (
  pubkey: Buffer,
  msghash: Buffer,
  signature: Buffer,
): boolean => {
  const ECPair = ECPairFactory(tinysecp)
  return ECPair.fromPublicKey(pubkey).verify(msghash, signature)
}
