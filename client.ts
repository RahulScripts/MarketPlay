import { AlgorandClient } from '@algorandfoundation/algokit-utils'

export type Network = 'mainnet' | 'testnet' | 'localnet'

/**
 * Returns an AlgorandClient connected to the desired network.
 *
 * @param network Choose between 'mainnet', 'testnet', or 'localnet'.
 */
export function getAlgorandClient(network: Network = 'mainnet'): AlgorandClient {
  switch (network) {
    case 'mainnet':
      return AlgorandClient.mainNet()
    case 'testnet':
      return AlgorandClient.testNet()
    case 'localnet':
      return AlgorandClient.defaultLocalNet()
    default:
      throw new Error(`Unsupported network: ${network}`)
  }
}

/**
 * Default client (mainnet)
 */
export const client = getAlgorandClient()
