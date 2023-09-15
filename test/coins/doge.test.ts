import {hdFromSeed, mnemonicToSeed} from '@noonewallet/core-js'
import {DOGE} from '@helpers/currencies'
import {ITxData} from '@helpers/types'
import {DogeTx} from '../../src'
import {mnemonic} from '../../mocks/walletMock'

const getNodes = () => {
  const seed = mnemonicToSeed(mnemonic)
  const node = hdFromSeed(seed)
  const externalNode = node.derive(DOGE.path + '/0')
  const internalNode = node.derive(DOGE.path + '/1')

  return {
    externalNode,
    internalNode,
  }
}

const signedTx = {
  hash: '44af4ca9d1a9ee8ae25f7f99ecf39d2e81f522bb966f3ac9c857754680855f66',
  tx: '0100000002df660ee0b94492cc15e0096fe7252b2d9466aa502e286093ff552ce7e43e1876000000006a47304402203c36950f9b7f28b2ec014cc87bdde9f8a6e43f7eba9c7e99064dfb2feacf055d02201801e383fa3a75bd5146dcb4ea9ba43f70d1b73571469b59d851a1e2b20ec2810121020408222933b1b0301f9370f2d169938aff654fdba1018e7b88ed2eaf68f9ea5effffffff1f7d307452ee5c8a7c68b03e92833795b9cddaa2a696659cd2b30cdc1e9b65c8000000006b483045022100c115eb3ee9cd749e9340fec70f62c84e905fbcd1575e7b8579a207740a5817c8022075fcab47635e7cc434fc8c9077e48a83340a8b295d2dce4251929a6ada95a25d0121020408222933b1b0301f9370f2d169938aff654fdba1018e7b88ed2eaf68f9ea5effffffff020065cd1d000000001976a9141165931e68869ee1bc6ec56c6812028796c41e1088acc04dc103000000001976a9146783b4c0f6b00eda015d19a4ecfdca8e30a213dd88ac00000000',
}

const getTxData = () => {
  const nodes = getNodes()
  const data: ITxData = {
    unspent: [
      {
        block_id: -1,
        transaction_hash:
          '76183ee4e72c55ff9360282e50aa66942d2b25e76f09e015cc9244b9e00e66df',
        index: 0,
        value: 350000000,
        address: 'DPfGCZM4g9Dncb69gg6QnWRjGkpCc5deYZ',
        derive_index: 0,
        node_type: 'external',
        tx: '01000000011f7d307452ee5c8a7c68b03e92833795b9cddaa2a696659cd2b30cdc1e9b65c8010000006a47304402206c9a480fc7b8c170d6f1e110e637b63b30933d7ed39eab055a5f960016d5a5800220711ef6753b5f2ce18b43b798c5e025755afdd264828af6b2c6795c98e689e64b0121025df9b095f3fc3a99c046c785458429c530219028fb07e8d344f06386afae0365ffffffff028093dc14000000001976a914cb26ce985cf64b8f8aa0afeaf9839c2f96da9af088acc077010d000000001976a914307fc49c66c50b91e265aa7f7e36f9d06b5f059688ac00000000',
      },
      {
        block_id: 4592392,
        transaction_hash:
          'c8659b1edc0cb3d29c6596a6a2dacdb9953783923eb0687c8a5cee5274307d1f',
        index: 0,
        value: 400000000,
        address: 'DPfGCZM4g9Dncb69gg6QnWRjGkpCc5deYZ',
        derive_index: 0,
        node_type: 'external',
        tx: '01000000013e2d394eb40894291615b3f82059ea92c16396a3280a24a5947bf59a12c759b4010000006b483045022100edd199f6cdb5ade143e168f89372d38fe4a80c8a517c482f969c3f40e691f7a602202a464bf39fa9f6fae4ce691d9a42d2e2f339b625e45975b7a72660329e5aa00a0121025df9b095f3fc3a99c046c785458429c530219028fb07e8d344f06386afae0365ffffffff020084d717000000001976a914cb26ce985cf64b8f8aa0afeaf9839c2f96da9af088ac80499a28000000001976a914307fc49c66c50b91e265aa7f7e36f9d06b5f059688ac00000000',
      },
    ],
    nodes: {
      internal: nodes.internalNode.privateExtendedKey,
      external: nodes.externalNode.privateExtendedKey,
    },
    feeList: [{level: 1, feePerByte: '500000'}],
    type: DOGE.type,
  }

  return data
}

describe('Doge Tests', () => {
  const txData = getTxData()

  test('has Buffer & Uint8array equivalency', () => {
    expect(Buffer.from('') instanceof Uint8Array).toBeTruthy()
  })

  test('should create tx class', () => {
    const txHandler = new DogeTx(txData)
    expect(txHandler).toBeDefined()
  })

  test('should calculate tx fee', async () => {
    const txHandler = new DogeTx(txData)
    const amount = 2
    const feeList = await txHandler.calcFee(amount)
    expect(feeList).toBeDefined()
    const fee = feeList[0]
    expect(fee.value).toEqual(113000000)
    expect(fee.inputsAmount).toEqual(350000000)
  })

  test('should create tx handler and sign tx', async () => {
    const txHandler = new DogeTx(txData)
    const amount = 5
    const feeList = await txHandler.calcFee(amount)
    const fee = feeList[0]
    const data = {
      address: 'D6j5i3yzQhKy9VARM7xbgXbE842uZkSSG2',
      changeAddress: 'DEaRv7dTjjZMicKaYpxEBDx3cqus8LJECR',
      amount,
      fee,
    }
    const tx = await txHandler.make(data)
    expect(tx.hash).toEqual(signedTx.hash)
    expect(tx.tx).toEqual(signedTx.tx)
  })
})
