import {BaseSyncWithMethods} from '@modules/base-sync'
import {LTC} from '@helpers/currencies'
// @ts-ignore
import {CoinsNetwork} from '@noonewallet/network-js'

export class LtcSync extends BaseSyncWithMethods {
  constructor(externalNodeKey: string, internalNodeKey: string) {
    super(externalNodeKey, internalNodeKey)
    this.network = LTC.network
    this.type = LTC.type
    this.setReqHandler(CoinsNetwork.ltc)
  }
}
