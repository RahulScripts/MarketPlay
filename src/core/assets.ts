import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'

/**
 * Manages Algorand Standard Assets (ASAs) including NFTs
 */
export class AssetManager {
  private client: AlgorandClient

  constructor(client: AlgorandClient) {
    this.client = client
  }

  /**
   * Create a new NFT (Non-Fungible Token)
   * NFTs have total=1 and decimals=0
   * 
   * @param params NFT creation parameters
   * @returns Asset ID of created NFT
   */
  async createNFT(params: {
    creator: algosdk.Account
    name: string
    unitName: string
    url: string
    metadata?: Uint8Array
    manager?: string // Can change manager, reserve, freeze, clawback
    reserve?: string // Non-minted tokens reside here
    freeze?: string // Can freeze asset holdings
    clawback?: string // Can revoke asset holdings
  }): Promise<number> {
    try {
      const { creator, name, unitName, url, metadata, manager, reserve, freeze, clawback } = params

      // Validate inputs
      if (name.length > 32) throw new Error('Asset name must be ≤32 characters')
      if (unitName.length > 8) throw new Error('Unit name must be ≤8 characters')

      // Create NFT using AlgoKit Utils v9.x
      const result = await this.client.send.assetCreate({
        sender: creator.addr,
        total: 1n, // NFT = only 1 unit
        decimals: 0,
        assetName: name,
        unitName,
        url,
        metadataHash: metadata,
        manager: manager || creator.addr,
        reserve: reserve || creator.addr,
        freeze: freeze || creator.addr,
        clawback: clawback || creator.addr,
        ) }
      })

      const assetId = Number(result.confirmation.assetIndex)
      console.log(`✅ NFT created: ${name} (ID: ${assetId})`)
      return assetId
    } catch (error) {
      throw new Error(`NFT creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a fungible token (e.g., game currency, reward tokens)
   * 
   * @param params Token creation parameters
   * @returns Asset ID of created token
   */
  async createToken(params: {
    creator: algosdk.Account
    name: string
    unitName: string
    total: bigint // Total supply
    decimals: number // Decimal places (0-19)
    url?: string
    manager?: string
    reserve?: string
    freeze?: string
    clawback?: string
  }): Promise<number> {
    try {
      const { creator, name, unitName, total, decimals, url, manager, reserve, freeze, clawback } = params

      // Validate
      if (decimals < 0 || decimals > 19) throw new Error('Decimals must be 0-19')
      if (total <= 0n) throw new Error('Total supply must be positive')

      const result = await this.client.send.assetCreate({
        sender: creator.addr,
        total,
        decimals,
        assetName: name,
        unitName,
        url,
        manager: manager || creator.addr,
        reserve: reserve || creator.addr,
        freeze: freeze || creator.addr,
        clawback: clawback || creator.addr,
        signer: { addr: creator.addr, signer: algosdk.makeBasicAccountTransactionSigner(creator) }
      })

      const assetId = Number(result.confirmation.assetIndex)
      console.log(`✅ Token created: ${name} (ID: ${assetId}, Supply: ${total})`)
      return assetId
    } catch (error) {
      throw new Error(`Token creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Opt-in to receive an asset (required before receiving transfers)
   * 
   * @param account - Account opting in
   * @param assetId - Asset to opt into
   */
  async optIn(account: algosdk.Account, assetId: number): Promise<string> {
    try {
      // Opt-in = 0-amount transfer to self
      const result = await this.client.send.assetOptIn({
        sender: account.addr,
        assetId: BigInt(assetId),
        signer: { addr: account.addr, signer: algosdk.makeBasicAccountTransactionSigner(account) }
      })

      console.log(`✅ ${account.addr} opted into asset ${assetId}`)
      return result.transaction.txID()
    } catch (error) {
      throw new Error(`Opt-in failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Transfer asset from one account to another
   * 
   * @param params Transfer parameters
   * @returns Transaction ID
   */
  async transferAsset(params: {
    from: algosdk.Account
    to: string
    assetId: number
    amount: bigint
    note?: string
  }): Promise<string> {
    try {
      const { from, to, assetId, amount, note } = params

      // Validate
      if (!algosdk.isValidAddress(to)) {
        throw new Error(`Invalid recipient address: ${to}`)
      }
      if (amount <= 0n) {
        throw new Error('Transfer amount must be positive')
      }

      // Check if recipient has opted in
      const toInfo = await this.client.client.algod.accountInformation(to).do()
      const hasOptedIn = toInfo.assets?.some((a: { 'asset-id': number }) => a['asset-id'] === assetId)
      
      if (!hasOptedIn) {
        throw new Error(`Recipient ${to} has not opted into asset ${assetId}`)
      }

      // Perform transfer
      const result = await this.client.send.assetTransfer({
        sender: from.addr,
        receiver: to,
        assetId: BigInt(assetId),
        amount,
        note: note ? new TextEncoder().encode(note) : undefined,
        signer: { addr: from.addr, signer: algosdk.makeBasicAccountTransactionSigner(from) }
      })

      console.log(`✅ Transferred ${amount} of asset ${assetId} to ${to}`)
      return result.transaction.txID()
    } catch (error) {
      throw new Error(`Asset transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get asset information
   * 
   * @param assetId - Asset ID to query
   */
  async getAssetInfo(assetId: number) {
    try {
      return await this.client.client.algod.getAssetByID(assetId).do()
    } catch (error) {
      throw new Error(`Failed to get asset info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get asset holdings for an account
   * 
   * @param address - Account address
   * @param assetId - Asset ID (optional, returns all if omitted)
   */
  async getAssetHolding(address: string, assetId?: number) {
    try {
      const accountInfo = await this.client.client.algod.accountInformation(address).do()
      const assets = accountInfo.assets || []
      
      if (assetId !== undefined) {
        return assets.find((a: { 'asset-id': number }) => a['asset-id'] === assetId)
      }
      
      return assets
    } catch (error) {
      throw new Error(`Failed to get asset holdings: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Destroy an asset (burn all units and remove from ledger)
   * Only works if creator holds all units
   * 
   * @param creator - Asset creator account
   * @param assetId - Asset to destroy
   */
  async destroyAsset(creator: algosdk.Account, assetId: number): Promise<string> {
    try {
      const result = await this.client.send.assetDestroy({
        sender: creator.addr,
        assetId: BigInt(assetId),
        signer: { addr: creator.addr, signer: algosdk.makeBasicAccountTransactionSigner(creator) }
      })

      console.log(`✅ Asset ${assetId} destroyed`)
      return result.transaction.txID()
    } catch (error) {
      throw new Error(`Asset destruction failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}