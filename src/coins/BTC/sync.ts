import {CurrencyType, IHeader} from '@helpers/types'
import {BaseSyncWithMethods} from '@modules/base-sync'
// @ts-ignore
import {CoinsNetwork} from '@noonewallet/network-js'

export class BtcSync extends BaseSyncWithMethods {
  constructor(
    externalNodeKey: string,
    internalNodeKey: string,
    headers: IHeader,
    type?: CurrencyType,
  ) {
    super(externalNodeKey, internalNodeKey, headers, type)
    this.network = 'btc'
    // this.type = type
    this.setReqHandler(CoinsNetwork.btc)
  }
}
