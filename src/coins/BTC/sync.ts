import {CurrencyType} from '@helpers/types'
import {BaseSyncWithMethods} from '@modules/base-sync'
// @ts-ignore
import {CoinsNetwork} from '@noonewallet/network-js'

export class BtcSync extends BaseSyncWithMethods {
  constructor(
    externalNodeKey: string,
    internalNodeKey: string,
    type?: CurrencyType,
  ) {
    super(externalNodeKey, internalNodeKey, type)
    this.network = 'btc'
    // this.type = type
    this.setReqHandler(CoinsNetwork.btc)
  }
}
