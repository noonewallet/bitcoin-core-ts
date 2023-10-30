import {Network} from 'bitcoinjs-lib'

export type CurrencyType = 'p2pkh' | 'p2wpkh'
export type NodeType = 'internal' | 'external'
export type ActionType = 'incoming' | 'outgoing'

export interface IAddressSyncItem {
  type: NodeType
  derive_index: number
  address: string
  pubkey?: string
}

export interface IDeriveAddressInfo {
  index: number | null
  node: NodeType
}

export interface IEmptyAddress {
  internal: IAddressSyncItem
  external: IAddressSyncItem
}

export interface ITxSyncItem {
  balance_change: number
  block_id: number
  hash: string
  time: number
  address?: string
  action?: ActionType
}

export interface ITxVinBtcv {
  txinwitness: string[]
  address: string | undefined
  mine?: string[]
  other?: string[]
}

export interface ITxVoutBtcv {
  value: number
  scriptPubKey: {
    addresses: string[]
  }
}
export interface ITxSyncItemBtcv {
  hash: string
  height: number | undefined
  vin: ITxVinBtcv[]
  vout: ITxVoutBtcv[]
  txid?: string
  action?: ActionType
  to?: string
  from?: string
  value?: number
  rawData: {
    [key: string]: string
  }
}

export interface IUnspent {
  address: string
  block_id: number
  derive_index: number
  index: number
  node_type: NodeType
  transaction_hash: string
  value: number
  tx?: RawTx
  key?: string
}

export interface IFeeSync {
  level: number | string
  feePerByte: string
}

export interface IFeeTx {
  id: string
  value: number
  coinValue: number
  feePerByte: number
  inputs: IUnspent[]
  inputsAmount: number
  custom?: boolean
}

export interface IFeeInputScope {
  fee: number
  inputs: IUnspent[]
  inputsAmount: number
}

export type FeeId = 'fast' | 'medium' | 'custom' | 'optimal'

export type ExtendedKey = string

export interface ITxData {
  unspent: IUnspent[] | []
  nodes: {
    internal: ExtendedKey
    external: ExtendedKey
  }
  feeList: IFeeSync[]
  type: CurrencyType
}

export interface IRawTxData {
  address: Address
  changeAddress: Address
  fee: IFeeTx
  amount: number
}

export type Address = string
export type KeyInWif = string
export type RawTx = string

export interface IInput {
  hash: string
  index: number
  address: Address
  value: number
  key: KeyInWif
  tx?: RawTx | null
  transaction_hash?: string
}

export interface IOutput {
  address: Address
  value: number
}

export interface IInputForSign {
  hash: string
  index: number
  witnessUtxo?: {
    script: Buffer
    value: number
  }
  nonWitnessUtxo?: Buffer
}

export interface IRawTxResponse {
  hash: string
  rawData: RawTx
}

export interface ITxOptions {
  network?: Network
  maximumFeeRate?: number
}

export interface ICoinCore {
  externalNode: string
  internalNode: string
  externalAddress: Address | undefined
  internalAddress: Address | undefined
}
