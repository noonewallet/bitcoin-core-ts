import {CurrencyType, IHeader} from '@helpers/types'
import {BaseSyncWithMethods} from '@modules/base-sync'
import {LTC} from '@helpers/currencies'
// @ts-ignore
import {CoinsNetwork} from '@noonewallet/network-js'

export class LtcSync extends BaseSyncWithMethods {
  constructor(
    externalNodeKey: string,
    internalNodeKey: string,
    headers: IHeader,
  ) {
    super(externalNodeKey, internalNodeKey, headers)
    this.network = LTC.network
    this.type = LTC.type
    this.setReqHandler(CoinsNetwork.ltc)
  }
}
