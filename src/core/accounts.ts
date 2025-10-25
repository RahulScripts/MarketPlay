import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'

/**
 * Manages Algorand accounts (creation, retrieval, signing)
 */
export class AccountManager {
  private client: AlgorandClient

  constructor(client: AlgorandClient) {
    this.client = client
  }

  /**
   * Generate a new random account
   * @returns Account with address and mnemonic
   */
  createAccount(): { account: algosdk.Account; mnemonic: string } {
    const account = algosdk.generateAccount()
    const mnemonic = algosdk.secretKeyToMnemonic(account.sk)
    return { account, mnemonic }
  }

  /**
   * Restore account from 25-word mnemonic
   * @param mnemonic - 25-word recovery phrase
   * @returns Algorand account
   */
  fromMnemonic(mnemonic: string): algosdk.Account {
    try {
      return algosdk.mnemonicToSecretKey(mnemonic)
    } catch (error) {
      throw new Error(`Invalid mnemonic: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get account information (balance, status, etc.)
   * @param address - Account address
   */
  async getAccountInfo(address: string) {
    try {
      return await this.client.client.algod.accountInformation(address).do()
    } catch (error) {
      throw new Error(`Failed to get account info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get account balance in microAlgos
   * @param address - Account address
   * @returns Balance in microAlgos (1 ALGO = 1,000,000 microAlgos)
   */
  async getBalance(address: string): Promise<number> {
    const info = await this.getAccountInfo(address)
    return info.amount
  }

  /**
   * Check if account has opted into an asset
   * @param address - Account address
   * @param assetId - Asset ID to check
   */
  async hasOptedIntoAsset(address: string, assetId: number): Promise<boolean> {
    const info = await this.getAccountInfo(address)
    const assets = info.assets || []
    return assets.some((asset: { 'asset-id': number }) => asset['asset-id'] === assetId)
  }

  /**
   * Fund account from dispenser (testnet/localnet only)
   * @param address - Account to fund
   * @param amount - Amount in ALGO (default: 10)
   */
  async fundFromDispenser(address: string, amount: number = 10) {
    try {
      await this.client.send.dispenser({ account: address, amount: algosdk.algosToMicroalgos(amount) })
      console.log(`✅ Funded ${address} with ${amount} ALGO`)
    } catch (error) {
      throw new Error(`Dispenser funding failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}