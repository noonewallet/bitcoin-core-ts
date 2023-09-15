import {hdFromSeed, mnemonicToSeed} from '@noonewallet/core-js'
import {BCH} from '@helpers/currencies'
import {ITxData} from '@helpers/types'
import {getBchAddressByNode} from '@coins/BCH/utils'
import {mnemonic} from '../../mocks/walletMock'
import {BchTx} from '../../src'
export const bch_wallet = {
  mnemonic:
    'art pupil danger scrap marriage garden diary three lunar oxygen horn surge section dish harvest',
  externalNode: {
    addressWithPrefix: 'bitcoincash:qramndy2hud36avmlu6wgehpxd57x5rgqc2yc640mx',
    address: 'qramndy2hud36avmlu6wgehpxd57x5rgqc2yc640mx',
  },
  internalNode: {
    addressWithPrefix: 'bitcoincash:qpy55hzx4hemjt9vgfavtexw5eap062ueq952e2pwv',
    address: 'qpy55hzx4hemjt9vgfavtexw5eap062ueq952e2pwv',
  },
}

const getNodes = (mnemonic: string) => {
  const seed = mnemonicToSeed(mnemonic)
  const node = hdFromSeed(seed)
  const externalNode = node.derive(BCH.path + '/0')
  const internalNode = node.derive(BCH.path + '/1')

  return {
    externalNode,
    internalNode,
  }
}

const signedTx = {
  hash: '23be390f2f403ccddd2242aa9d767edbbf92cc2d249da67fed82848467f8315b',
  tx: '0200000001c3288f802f576a0ad80fd8cd66ea11907a2032784516f4a4126d967f831a0580000000006b483045022100f8bfb1613d1c4ccc0158ef5b270375c87ff6d516f150210549b2b486c4bd24d9022013816e1a2e95589889902608ec4847bb558a7fc1b621d556d0d5f666851e50d34121035c565688f6312531c1c359f31315e2425f74a03a9935039fbfe3c2def473c038ffffffff02a0860100000000001976a9149642ca8cf300b1168ba657846a20ea7dc7db3c8688ac9a0a0300000000001976a9149a0df1fea563846d9528139ecc31bfa6bdacb4f688ac00000000',
}

const getTxData = () => {
  const nodes = getNodes(mnemonic)
  const data: ITxData = {
    unspent: [
      {
        block_id: 779454,
        transaction_hash:
          '80051a837f966d12a4f416457832207a9011ea66cdd80fd80a6a572f808f28c3',
        index: 0,
        value: 300000,
        address: 'qrqsl986x9wmee2f250lr0te3mxpkp4p35ce6qhska',
        derive_index: 1,
        node_type: 'external',
      },
    ],
    nodes: {
      internal: nodes.internalNode.privateExtendedKey,
      external: nodes.externalNode.privateExtendedKey,
    },
    feeList: [{level: 'optimal', feePerByte: '3'}],
    type: BCH.type,
  }

  return data
}

describe('BCH Tests', () => {
  test('should check bch addresses', () => {
    const nodes = getNodes(bch_wallet.mnemonic)
    expect(nodes).toBeDefined()
    const externalAddress = getBchAddressByNode(nodes.externalNode, 0)
    const externalAddressWithPrefix = getBchAddressByNode(
      nodes.externalNode,
      0,
      true,
    )
    expect(externalAddress).toEqual(bch_wallet.externalNode.address)
    expect(externalAddressWithPrefix).toEqual(
      bch_wallet.externalNode.addressWithPrefix,
    )
    const internalAddress = getBchAddressByNode(nodes.internalNode, 0)
    const internalAddressWithPrefix = getBchAddressByNode(
      nodes.internalNode,
      0,
      true,
    )
    expect(internalAddress).toEqual(bch_wallet.internalNode.address)
    expect(internalAddressWithPrefix).toEqual(
      bch_wallet.internalNode.addressWithPrefix,
    )
  })

  test('should create tx class', () => {
    const txData = getTxData()
    const txHandler = new BchTx(txData)
    expect(txHandler).toBeDefined()
  })

  test('should calculate tx fee', async () => {
    const txData = getTxData()
    const txHandler = new BchTx(txData)
    const amount = 0.001
    const feeList = await txHandler.calcFee(amount)
    expect(feeList).toBeDefined()
    const fee = feeList[0]
    expect(fee.value).toEqual(678)
    expect(fee.inputsAmount).toEqual(300000)
  })

  test('should create tx handler and sign tx', async () => {
    const txData = getTxData()
    const txHandler = new BchTx(txData)
    const amount = 0.001
    const feeList = await txHandler.calcFee(amount)
    const fee = feeList[0]
    const data = {
      address: 'qzty9j5v7vqtz95t5etcg63qaf7u0keusc06dzznh4',
      changeAddress: 'qzdqmu07543cgmv49qfeanp3h7ntmt957c9yzz6tys',
      amount,
      fee,
    }
    const tx = await txHandler.make(data)
    expect(tx.hash).toEqual(signedTx.hash)
    expect(tx.tx).toEqual(signedTx.tx)
  })

  // test('should create tx with  and sign tx', async () => {
  //   const txData = getTxData()
  //   const txHandler = new BchTx(txData)
  //   const amount = 0.001
  //   const feeList = await txHandler.calcFee(amount)
  //   const fee = feeList[0]
  //   const data = {
  //     address: '115uEfQMqpZXWbbyLBqx9m9oa3szkoWm4e',
  //     changeAddress: '1A4eD3w4Bi3dpSVx4hC3ti9pMk54zv9QPx',
  //     amount,
  //     fee,
  //   }
  //   const tx = await txHandler.make(data)
  //   expect(tx.hash).toEqual(test_tx_data.hash)
  //   expect(tx.tx).toEqual(test_tx_data.tx)
  // })
})
