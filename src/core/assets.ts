import { Algodv2 } from 'algosdk'
import { AlgorandClient } from '@algorandfoundation/algokit-utils'

class AssetManager {
  private client: AlgorandClient

  constructor(client: AlgorandClient) {
    this.client = client
  }

  async createNFT(params: { name: string; unitName: string; url: string; creator: string }) {
    const { name, unitName, url, creator } = params
    const txn = await this.client.transactions.assetCreate({
      from: creator,
      total: 1,
      decimals: 0,
      assetName: name,
      unitName,
      url,
    })
    return txn
  }

  async transferAsset(assetId: number, from: string, to: string, amount: number = 1) {
    return this.client.transactions.assetTransfer({
      assetId,
      from,
      to,
      amount,
    })
  }
}

export { AssetManager }