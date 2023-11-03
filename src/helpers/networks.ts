import {Network} from 'bitcoinjs-lib'

export type NetworkType = 'btc' | 'btcv' | 'doge' | 'ltc' | 'mainnet'

interface NetworkList {
  [key: string]: Network
}

export const networks: NetworkList = {
  btc: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80,
  },
  btcv: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'royale',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x4e,
    scriptHash: 0x3c,
    wif: 0x80,
  },
  doge: {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    // @ts-ignore
    bech32: undefined,
    bip32: {
      public: 0x02facafd,
      private: 0x02fac398,
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
  },
  ltc: {
    messagePrefix: '\u0019Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: {
      public: 0x019da462, //27108450,
      private: 0x019d9cfe, //27106558,
    },
    pubKeyHash: 0x30, //48,
    scriptHash: 0x32, //50,
    wif: 0xb0, //176,
  },
  bch: {
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: {
      public: 0x0488b21e,
      private: 0x0488ade4,
    },
    pubKeyHash: 0x00,
    scriptHash: 0x08,
    wif: 0x80,
  },
}

export {Network}
