import {
  IAddressSyncItem,
  IEmptyAddress,
  ITxSyncItem,
  IUnspent,
} from '@helpers/types'

const defaultNoRestoredParams = ['externalNode', 'internalNode', 'request']

export interface IRestoreData {
  addresses: {
    all: string[]
    external: IAddressSyncItem[]
    internal: IAddressSyncItem[]
    empty: IEmptyAddress
  }
  balance: number
  all: ITxSyncItem[]
  unique: ITxSyncItem[]
  unspent: IUnspent[]
}

export const restoreClass = (
  // eslint-disable-next-line @typescript-eslint/ban-types
  obj: {},
  restoredData: IRestoreData,
  noRestoredParams = [],
) => {
  const params = noRestoredParams.length
    ? noRestoredParams
    : defaultNoRestoredParams

  if (!restoredData || typeof restoredData !== 'object') return
  for (const key in restoredData) {
    if (!params.includes(key) && key in obj) {
      // @ts-ignore
      obj[key as keyof IRestoreData] = restoredData[key as keyof IRestoreData]
    }
  }
}
