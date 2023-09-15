import {BaseSyncWithMethods} from '@modules/base-sync'
import {DOGE} from '@helpers/currencies'
// @ts-ignore
import {CoinsNetwork} from '@noonewallet/network-js'

export class DogeSync extends BaseSyncWithMethods {
  constructor(externalNodeKey: string, internalNodeKey: string) {
    super(externalNodeKey, internalNodeKey)
    this.network = DOGE.network
    this.type = DOGE.type
    this.setReqHandler(CoinsNetwork.doge)
  }
}
