import {hdFromSeed, mnemonicToSeed} from '@noonewallet/core-js'
import {getBtcBasedCore} from '@helpers/utils'
import * as currencies from '@helpers/currencies'
import {wallet, BtcNodes} from '../../mocks/walletMock'

const getNode = () => {
  const seed = mnemonicToSeed(wallet.mnemonic)
  const node = hdFromSeed(seed)
  // const externalNode = node.derive(BTC.path + '/0')
  // const internalNode = node.derive(BTC.path + '/1')
  // const externalNodeKey: string = externalNode.privateExtendedKey
  // const internalNodeKey: string = internalNode.privateExtendedKey
  return node
}

describe('Utils test', () => {
  // test('It should test sync', () => {
  //   const node = getNode()
  //   const externalNode = getKeysAndAddressByNode(nodes.external, 0)
  //   expect(externalNode).toBeDefined()
  //   expect(externalNode.privateKey).toEqual(wallet.btc.external[0].privateKey)
  //   expect(externalNode.publicKey).toEqual(wallet.btc.external[0].publicKey)
  //   expect(externalNode.address).toEqual(wallet.btc.external[0].address)
  //
  //   const internalNode = getKeysAndAddressByNode(nodes.internal, 0)
  //   expect(internalNode).toBeDefined()
  //   expect(internalNode.privateKey).toEqual(wallet.btc.internal[0].privateKey)
  //   expect(internalNode.publicKey).toEqual(wallet.btc.internal[0].publicKey)
  //   expect(internalNode.address).toEqual(wallet.btc.internal[0].address)
  // })

  test.only('It should create BTC legacy node', () => {
    const node = getNode()
    const {BTC} = currencies
    const btc_node = getBtcBasedCore(node, BTC.shortName, BTC.type)
    expect(btc_node).toBeDefined()
    expect(btc_node.externalNode).toEqual(
      BtcNodes.external[0].privateExtendedKey,
    )
    expect(btc_node.externalAddress).toEqual(BtcNodes.external[0].address)
    expect(btc_node.internalNode).toEqual(
      BtcNodes.internal[0].privateExtendedKey,
    )
    expect(btc_node.internalAddress).toEqual(BtcNodes.internal[0].address)
  })
})
