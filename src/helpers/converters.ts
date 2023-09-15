import bigDecimal from 'js-big-decimal'

/**
 * Bitcoin and Ethereum converter
 */
const BTC_FACTOR = Math.pow(10, 8)
const PRECISION = 10

export default {
  /**
   * Convert Satoshi to Bitcoin
   * @param {string} sat
   * @param {number} customPrecision
   * @param {boolean} returnNumber
   * @returns {number} btc
   */
  sat_to_btc(
    sat: number,
    customPrecision?: number,
    returnNumber?: boolean,
  ): number | string {
    if (!+sat) return 0
    const stringSat = sat.toString()
    const n1 = new bigDecimal(stringSat)
    const n2 = new bigDecimal(BTC_FACTOR)
    const num: bigDecimal = n1.divide(n2, customPrecision || PRECISION)
    // TODO: check value
    const value = num.getValue()
    return returnNumber ? +value : removeLastZero(+value)
  },
  /**
   * Convert Bitcoin to Satoshi
   * @param {string} btc
   * @returns {number} sat
   */
  btc_to_sat(btc: number) {
    if (!+btc) return 0
    const stringBtc = btc.toString()
    const n1 = new bigDecimal(stringBtc)
    const n2 = new bigDecimal(BTC_FACTOR)
    const num = n1.multiply(n2)
    // TODO: check value
    const value = num.getValue()
    return +bigDecimal.floor(value)
  },
}

function removeLastZero(value: number): string {
  if (!value) return '0'

  let num = value.toString()
  if (!num.includes('.')) return num

  while (num[num.length - 1] === '0') {
    num = num.slice(0, -1)
  }

  if (num[num.length - 1] === '.') {
    num = num.slice(0, -1)
  }

  return num
}
