import {NetworkType} from '@helpers/networks'
import {CurrencyType} from '@helpers/types'

export interface ICurrency {
  shortName: string
  name: string
  path: string
  pubKeyPrefix: string
  type: CurrencyType
  network: NetworkType
}

export const BTC: ICurrency = {
  shortName: 'BTC',
  name: 'Bitcoin',
  type: 'p2pkh',
  path: `m/44'/0'/0'`,
  pubKeyPrefix: 'xpub',
  network: 'btc',
}
export const BTC_SEGWIT: ICurrency = {
  shortName: 'BTC',
  name: 'Bitcoin',
  type: 'p2wpkh',
  path: `m/84'/0'/0'`,
  pubKeyPrefix: 'xpub',
  network: 'btc',
}
export const DOGE: ICurrency = {
  shortName: 'DOGE',
  name: 'Dogecoin',
  type: 'p2pkh',
  path: `m/44'/3'/0'`,
  pubKeyPrefix: 'dgub',
  network: 'doge',
}

export const BTCV: ICurrency = {
  shortName: 'BTCV',
  name: 'Bitcoin Vault',
  type: 'p2wpkh',
  path: `m/84'/440'/0'`,
  pubKeyPrefix: 'xpub',
  network: 'btcv',
}

export const LTC: ICurrency = {
  shortName: 'DOGE',
  name: 'Litecoin',
  type: 'p2wpkh',
  path: `m/84'/2'/0'`,
  pubKeyPrefix: 'Ltub',
  network: 'ltc',
}

export const BCH: ICurrency = {
  shortName: 'BCH',
  name: 'Bitcoin Cash',
  type: 'p2pkh',
  path: `m/44'/145'/0'`,
  pubKeyPrefix: 'xpub',
  network: 'mainnet',
}
