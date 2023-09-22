import {hdFromSeed, mnemonicToSeed} from '@noonewallet/crypto-core-ts'
import {BTC_SEGWIT, ICurrency} from '@helpers/currencies'
import {ITxData} from '@helpers/types'
import {BtcTx} from '../../src'
import {mnemonic} from '../../mocks/walletMock'

const getNodes = (currency: ICurrency) => {
  const seed = mnemonicToSeed(mnemonic)
  const node = hdFromSeed(seed)
  const externalNode = node.derive(currency.path + '/0')
  const internalNode = node.derive(currency.path + '/1')

  return {
    externalNode,
    internalNode,
  }
}

const signedTx = {
  hash: 'f9d79edfb75dbce1c2ffc73911013108e9218cd464d89e6df793ebc851b783da',
  tx: '010000000001018bdcf753e9455b7ffe3cdbd74c484ce843dd578792a16a496338faddb67569960000000000ffffffff021027000000000000160014bb96995ffc0c2ad7437774931476fca400bfb592f20d000000000000160014a2cb5d750ba95b6e3d38b5ee9b45adae6d12c560024730440220566d4c30da266821466d894d9c9d44ad77e521b0de22e178b87ae220c3aa31060220269fa209e8fd08f21995f1a49697a7e3c77a458061c3ef6a0e6f5b7beca361e50121039eac27b6c913b1a5e140ae4e7a0808f0e2b77f55ff51ee452806f3fe23b98a0700000000',
}

const getTxData = () => {
  const nodes = getNodes(BTC_SEGWIT)
  const data: ITxData = {
    unspent: [
      {
        block_id: 776034,
        transaction_hash:
          '966975b6ddfa3863496aa1928757dd43e84c484cd7db3cfe7f5b45e953f7dc8b',
        index: 0,
        value: 15000,
        address: 'bc1qd2p69277sc3rn696ekqca7ts0f08lr0sl0e3nl',
        derive_index: 0,
        node_type: 'external',
      },
      {
        block_id: 776024,
        transaction_hash:
          '4fd57216bb06e3c001beb01421280b62d009e2602a1f6262fe1bbeb355bde033',
        index: 0,
        value: 10000,
        address: 'bc1qd2p69277sc3rn696ekqca7ts0f08lr0sl0e3nl',
        derive_index: 0,
        node_type: 'external',
      },
      {
        block_id: 775934,
        transaction_hash:
          'eb05df8a7f10d3178976d6332b99d4e068ea99a0db097f894a2c18e7faa1e852',
        index: 0,
        value: 1000,
        address: 'bc1qd2p69277sc3rn696ekqca7ts0f08lr0sl0e3nl',
        derive_index: 0,
        node_type: 'external',
      },
    ],
    nodes: {
      internal: nodes.internalNode.privateExtendedKey,
      external: nodes.externalNode.privateExtendedKey,
    },
    feeList: [
      {level: 1, feePerByte: '25'},
      {level: 2, feePerByte: '10'},
    ],
    type: BTC_SEGWIT.type,
  }

  return data
}

describe('BTC Tx Tests', () => {
  const txData = getTxData()

  test('should create tx class', () => {
    const txHandler = new BtcTx(txData)
    expect(txHandler).toBeDefined()
  })

  test('should calculate tx fee', async () => {
    const txHandler = new BtcTx(txData)
    const amount = 0.00005
    const feeList = await txHandler.calcFee(amount)
    expect(feeList).toBeDefined()
    const fee = feeList[0]
    expect(fee.value).toEqual(3575)
    expect(fee.inputsAmount).toEqual(15000)
  })

  test('should create tx handler and sign tx', async () => {
    const txHandler = new BtcTx(txData)
    const amount = 0.0001
    const feeList = await txHandler.calcFee(amount)
    const fee = feeList[1]
    const data = {
      address: 'bc1qhwtfjhlups4dwsmhwjf3gahu5sqtldvjtatul0',
      changeAddress: 'bc1q5t946agt49dku0fckhhfk3dd4ek393tqfxkz9u',
      amount,
      fee,
    }
    const tx = await txHandler.make(data)
    expect(tx.hash).toEqual(signedTx.hash)
    expect(tx.tx).toEqual(signedTx.tx)
  })
})
