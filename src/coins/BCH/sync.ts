import {HDNode} from '@noonewallet/core-js'
import {getBchAddressByNode} from '@coins/BCH/utils'
import {Address} from '@helpers/types'
import {BaseSyncWithMethods} from '@modules/base-sync'
import {BCH} from '@helpers/currencies'
// @ts-ignore
import {CoinsNetwork} from '@noonewallet/network-js'

/**
 * Class BitcoinCashSync.
 * This class allows you to get information about the balance on a Bitcoin Cash wallet,
 * the list of unspent, a set of addresses that participated in transactions, and a list of transactions
 * @class
 */

export class BchSync extends BaseSyncWithMethods {
  constructor(externalNodeKey: string, internalNodeKey: string) {
    super(externalNodeKey, internalNodeKey)
    this.network = BCH.network
    this.type = BCH.type
    this.setReqHandler(CoinsNetwork.bch)
  }

  getAddressByNode(node: HDNode, i: number): Address {
    return getBchAddressByNode(node, i)
  }
}
