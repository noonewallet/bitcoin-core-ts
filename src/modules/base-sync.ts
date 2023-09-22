import {hdFromXprv, HDNode} from '@noonewallet/crypto-core-ts'
import {getAddressByNode} from '@helpers/utils'
import {
  CurrencyType,
  NodeType,
  IEmptyAddress,
  INodeSyncItem,
  IAddressSyncItem,
  IEmptyAddressData,
  ITxSyncItem,
  IUnspent,
  IFeeSync,
  Address,
  IDeriveAddressInfo,
} from '@helpers/types'
import {NetworkType} from '@helpers/networks'

import {restoreClass, IRestoreData} from '@helpers/restore-class'

export class BaseSync {
  protected externalNode: HDNode
  protected internalNode: HDNode
  protected balance: number
  protected latestBlock: number
  protected unspent: IUnspent[]
  protected addresses: {
    all: string[]
    external: IAddressSyncItem[]
    internal: IAddressSyncItem[]
    empty: IEmptyAddress
  }
  protected syncAddresses: {
    external: Address[]
    internal: Address[]
    all: Address[]
  }
  protected deriveAddress: {
    internal: string[]
    external: string[]
  }
  protected transactions: {
    all: ITxSyncItem[]
    unique: ITxSyncItem[]
  }
  protected fee: IFeeSync[]
  protected type: CurrencyType
  protected reqHandler: null
  protected network: NetworkType

  constructor(
    externalNodeKey: string,
    internalNodeKey: string,
    type?: CurrencyType,
  ) {
    this.externalNode = hdFromXprv(externalNodeKey)
    this.internalNode = hdFromXprv(internalNodeKey)
    this.balance = 0
    this.latestBlock = 0
    this.unspent = []
    this.addresses = {
      external: [],
      internal: [],
      empty: {
        external: {
          type: 'external',
          derive_index: 0,
          address: '',
        },
        internal: {
          type: 'internal',
          derive_index: 0,
          address: '',
        },
      },
      all: [],
    }
    this.syncAddresses = {
      external: [],
      internal: [],
      all: [],
    }
    this.deriveAddress = {
      internal: [],
      external: [],
    }
    this.transactions = {
      all: [],
      unique: [],
    }
    this.fee = []
    this.type = type || 'p2pkh'
    this.reqHandler = null
    this.network = 'btc'
  }

  protected setReqHandler(handler: null) {
    this.reqHandler = handler
  }

  restore(data: IRestoreData) {
    restoreClass(this, data)
  }

  get DATA() {
    return {
      addresses: this.addresses,
      syncAddresses: this.syncAddresses,
      transactions: this.transactions,
      unspent: this.unspent,
      balance: this.balance,
      latestBlock: this.latestBlock,
      fee: this.fee,
    }
  }
}

export class BaseSyncWithMethods extends BaseSync {
  constructor(
    externalNodeKey: string,
    internalNodeKey: string,
    type?: CurrencyType,
  ) {
    super(externalNodeKey, internalNodeKey, type)
  }

  public async Start(): Promise<void> {
    this.transactions = {
      all: [],
      unique: [],
    }
    this.unspent = []
    await Promise.all([await this.getAddresses(), await this.getFees()])
    this.getBalance()
  }

  async getAddresses(): Promise<void> {
    const nodeData: INodeSyncItem[] = [
      {
        node: this.externalNode,
        type: 'external',
      },
      {
        node: this.internalNode,
        type: 'internal',
      },
    ]

    const pArray = nodeData.map(async (item) => {
      return await this.getAddressesByNode(item.node, item.type)
    })

    const addresses = await Promise.all(pArray)
    this.addresses.external = addresses[0].list
    this.addresses.internal = addresses[1].list
    this.syncAddresses.external = addresses[0].syncList
    this.syncAddresses.internal = addresses[1].syncList
    this.addresses.empty = {
      external: this.addresses.external[this.addresses.external.length - 1],
      internal: this.addresses.internal[this.addresses.internal.length - 1],
    }
    this.addresses.all = [
      ...this.addresses.external,
      ...this.addresses.internal,
    ].map((item) => item.address)
    this.syncAddresses.all = [
      ...this.syncAddresses.external,
      ...this.syncAddresses.internal,
    ]
    await this.processTransactions()
    await this.getTxInfoForUnspent()
  }

  getAddressByNode(node: HDNode, i: number): Address {
    return getAddressByNode(node, i, this.type, this.network)
  }

  _getArrayOfAddresses(
    node: HDNode,
    type: NodeType,
    from: number,
    to: number,
  ): Address[] {
    const addresses: Address[] = []
    for (let i = from; i < to; i++) {
      let address = ''

      if (this.deriveAddress[type].hasOwnProperty(i)) {
        address = this.deriveAddress[type][i]
      } else {
        address = this.getAddressByNode(node, i)
        this.deriveAddress[type][i] = address
      }

      addresses.push(address)
    }

    return addresses
  }

  _getDeriveIndexByAddress(address: Address): IDeriveAddressInfo {
    let find = this.addresses.external.find((item) => item.address === address)
    let node: NodeType = 'external'

    if (!find) {
      find = this.addresses.internal.find((item) => item.address === address)
      node = 'internal'
    }

    return {
      index: find ? find.derive_index : null,
      node,
    }
  }

  async getAddressesByNode(
    node: HDNode,
    type: NodeType,
  ): Promise<{
    list: IAddressSyncItem[]
    syncList: Address[]
  }> {
    const CONTROL_COUNT = 20
    const STEP = 40
    const list: IAddressSyncItem[] = []
    const syncList: Address[] = []
    let counter = 0
    let derive_index = 0
    const empty: IEmptyAddressData = {
      status: false,
      data: {
        type: 'external',
        derive_index: 0,
        address: '',
      },
    }
    const data = {
      from: 0,
      to: STEP,
    }

    const req = async () => {
      const addresses = this._getArrayOfAddresses(
        node,
        type,
        data.from,
        data.to,
      )

      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const res = await this.reqHandler.getAddressInfo(addresses)
        if (res.hasOwnProperty('utxo')) {
          this.unspent = [...this.unspent, ...res.utxo]
        }

        if (res.hasOwnProperty('lastblock')) {
          this.latestBlock = res.lastblock
        }

        if (res.hasOwnProperty('transactions') && res.transactions.length) {
          this.transactions.all = [
            ...this.transactions.all,
            ...res.transactions,
          ]
        }
        for (let i = data.from; i < data.to; i++) {
          const index = i - data.from
          const address = addresses[index]
          const find = res.transactions.find(
            (itm: ITxSyncItem) => itm.address === address,
          )
          const item = {
            type,
            derive_index,
            address,
          }

          if (find) {
            counter = 0
            list.push(item)
          } else {
            counter++
            if (!empty.status) {
              empty.status = true
              empty.data = item
            }
          }
          syncList.push(address)
          derive_index++
        }
        if (counter < CONTROL_COUNT) {
          data.from += STEP
          data.to += STEP
          await req()
        } else {
          list.push(empty.data)
        }
      } catch (e) {
        console.log('BTC SyncPromise', e)
      }
    }

    await req()

    return {list, syncList}
  }

  async processTransactions(): Promise<void> {
    const hashes = this.transactions.all.map((item) => item.hash)
    const unique_hashes = [...new Set(hashes)]

    for (const hash of unique_hashes) {
      const group = this.transactions.all.filter((item) => item.hash === hash)
      const balance_change = group.reduce(
        (sum, curValue) => sum + curValue.balance_change,
        0,
      )

      const tx: ITxSyncItem = {
        hash,
        balance_change,
        address: group[0].address,
        block_id: group[0].block_id,
        time: group[0].time,
        action: balance_change > 0 ? 'incoming' : 'outgoing',
      }

      this.transactions.unique.push(tx)
    }
  }

  async getTxInfoForUnspent(): Promise<void> {
    if (!this.unspent.length) return
    const unspent = []

    for (const item of this.unspent) {
      if (!item.address) {
        console.log("Can't find the unspent address")
        continue
      }

      const derivationInfo = this._getDeriveIndexByAddress(item.address)

      if (derivationInfo.index === null) continue

      item.derive_index = derivationInfo.index
      item.node_type = derivationInfo.node
      unspent.push(item)
    }

    this.unspent = unspent
  }

  getBalance(): void {
    let balance = 0

    this.unspent.forEach((item: IUnspent) => {
      if (item && item.hasOwnProperty('value')) {
        balance += +item.value
      }
    })

    this.balance = balance
  }

  async getFees(): Promise<void> {
    try {
      // @ts-ignore
      this.fee = await this.reqHandler.getFees()
    } catch (err) {
      console.log('BTC getFeesRequest', err)
    }
  }
}
