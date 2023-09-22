import {hdFromSeed, mnemonicToSeed} from '@noonewallet/crypto-core-ts'
import {getBtcBasedCore} from '@helpers/utils'
import * as currencies from '@helpers/currencies'
import {wallet, BtcNodes} from '../../mocks/walletMock'

const getNode = () => {
  const seed = mnemonicToSeed(wallet.mnemonic)
  return hdFromSeed(seed)
}

describe('Utils test', () => {
  test('It should create BTC legacy node', () => {
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
