import {hdFromSeed, mnemonicToSeed} from '@noonewallet/core-js'
import {BTC} from '@helpers/currencies'
import {BaseTx} from '@modules/base-tx'
import {ITxData} from '@helpers/types'
import {wallet} from '../../mocks/walletMock'

const getBtcNode = () => {
  const seed = mnemonicToSeed(wallet.mnemonic)
  const node = hdFromSeed(seed)
  const externalNode = node.derive(BTC.path + '/0')
  const internalNode = node.derive(BTC.path + '/1')
  const externalNodeKey: string = externalNode.privateExtendedKey
  const internalNodeKey: string = internalNode.privateExtendedKey
  return {
    internal: internalNodeKey,
    external: externalNodeKey,
  }
}

describe('BTC based txs', () => {
  test.only('It should create Bitcoin based tx', () => {
    const nodes = getBtcNode()
    const data: ITxData = {
      unspent: [],
      nodes,
      feeList: [],
      type: 'p2pkh',
    }
    const btcClass = new BaseTx(data)
    expect(btcClass).toBeDefined()
  })
})
