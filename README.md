[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat)](https://github.com/noonewallet/bitcoin-core-ts/blob/main/LICENSE)
[![Platform](https://img.shields.io/badge/platform-web-blue.svg?style=flat)]()
![Dynamic JSON Badge](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fraw.githubusercontent.com%2Fnoonewallet%2Fbitcoin-core-ts%2Fmain%2Fpackage.json&query=version&label=version)

![bitcoin-core-ts](https://github.com/noonewallet/noone-android-core-crypto/assets/111989613/1f062349-24d4-4824-9c00-b8f2724eca51)

# bitcoin-core-ts

The bitcoin-core-ts library is an implementation of tools for working with Bitcoin (P2WPKH and P2PKH) and Bitcoin-like
coins. This library supports BTC, DOGE, BCH, and LTC.
It allows generating keys and addresses, as well as signing transactions.

**Note**: Node version >= 16.15.0

## Usage

### Generate keys and addresses:

```
import {utils as BtcUtils}                from '@noonewallet/bitcoin-core-ts'
import {createCoreByMnemonic, hdFromXprv} from '@noonewallet/core-js'

const mnemonic = 'judge same gain ... salad lake cash '
const {xprv} = createCoreByMnemonic(mnemonic)
const node = hdFromXprv(xprv)
const core = BtcUtils.getBtcBasedCore(node, 'BTC', 'P2WPKH')

console.log(
  core.externalNode,
  core.internalNode,
  core.externalAddress,
  core.internalAddress
)
```

### Create a transaction:

```
import {BtcTx} from '@noonewallet/bitcoin-core-ts'

const txHandler = new BtcTx({
  unspent: [...], // a list of unspent for current wallet, IUnspent[]
  feeList: [...], // a fee list, IFeeTx[]
  type: 'P2WPKH', // coin type
  nodes: {
    internal: core.internalNode,
    external: core.externalNode
  }
})

let tx_params = {
    address: 'bc1qw587v65...7c6u5q346l67psu9k', // a recipient address
    amount: 0.5, // a sending amount in BTC
    fee: tx.fee, // a transaction fee, IFeeTx
    changeAddress: 'bc1q697csgw...yra346l6duxh' // a change address
}

const sign_tx = txHandler.make(tx_params)
console.log(
  sign_tx.hash, // => 'a762b25b81b7d43...42e1adb81b7df272',
  sign_tx.tx, // => '0100000001a8aa068298a65...72010000006b48304502210'
)
```

## Created using
* [@noonewallet/crypto-core-ts](https://github.com/noonewallet/crypto-core-ts)
* [js-big-decimal](https://github.com/royNiladri/js-big-decimal)
* [bitcoinjs-lib](https://github.com/bitcoinjs/bitcoinjs-lib)
* [bitcore-lib-cash](https://github.com/bitpay/bitcore/tree/master/packages/bitcore-lib-cash)
* [ecpair](https://github.com/bitcoinjs/ecpair)
* [tiny-secp256k1](https://github.com/bitcoinjs/tiny-secp256k1)

## License

bitcoin-core-ts is available under the MIT license. See
the [LICENSE](https://github.com/noonewallet/bitcoin-core-ts/blob/main/LICENSE) file for more info.
