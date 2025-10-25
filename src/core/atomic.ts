import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'

/**
 * Manages atomic transactions (all-or-nothing transaction groups)
 * Essential for secure marketplace operations
 */
export class AtomicTransactionManager {
  private client: AlgorandClient

  constructor(client: AlgorandClient) {
    this.client = client
  }

  /**
   * Execute atomic swap: Payment + Asset Transfer
   * This ensures buyer gets asset ONLY if seller gets payment (and vice versa)
   * 
   * @param params Atomic swap parameters
   * @returns Transaction group ID
   */
  async atomicSwap(params: {
    buyer: algosdk.Account
    seller: algosdk.Account
    assetId: number
    assetAmount: bigint
    paymentAmount: number // in microAlgos
  }): Promise<string> {
    try {
      const { buyer, seller, assetId, assetAmount, paymentAmount } = params

      // Validate inputs
      if (paymentAmount <= 0) throw new Error('Payment amount must be positive')
      if (assetAmount <= 0n) throw new Error('Asset amount must be positive')

      // Get suggested parameters
      const suggestedParams = await this.client.client.algod.getTransactionParams().do()

      // Transaction 1: Buyer sends ALGO to Seller
      const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: buyer.addr,
        to: seller.addr,
        amount: paymentAmount,
        suggestedParams
      })

      // Transaction 2: Seller sends Asset to Buyer
      const assetTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
        from: seller.addr,
        to: buyer.addr,
        assetIndex: assetId,
        amount: assetAmount,
        suggestedParams
      })

      // Group transactions atomically
      const groupID = algosdk.assignGroupID([paymentTxn, assetTxn])

      // Sign both transactions
      const signedPaymentTxn = paymentTxn.signTxn(buyer.sk)
      const signedAssetTxn = assetTxn.signTxn(seller.sk)

      // Submit grouped transactions
      const { txId } = await this.client.client.algod
        .sendRawTransaction([signedPaymentTxn, signedAssetTxn])
        .do()

      // Wait for confirmation
      await algosdk.waitForConfirmation(this.client.client.algod, txId, 4)

      console.log(`✅ Atomic swap completed: ${assetAmount} of asset ${assetId} ↔ ${paymentAmount} microAlgos`)
      console.log(`   Group ID: ${Buffer.from(groupID).toString('base64')}`)
      
      return txId
    } catch (error) {
      throw new Error(`Atomic swap failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Execute atomic marketplace purchase
   * Combines: Buyer payment + Seller asset transfer + Optional royalty payment
   * 
   * @param params Marketplace purchase parameters
   */
  async marketplacePurchase(params: {
    buyer: algosdk.Account
    seller: algosdk.Account
    assetId: number
    price: number // in microAlgos
    royaltyRecipient?: string
    royaltyAmount?: number // in microAlgos
  }): Promise<string> {
    try {
      const { buyer, seller, assetId, price, royaltyRecipient, royaltyAmount } = params

      const suggestedParams = await this.client.client.algod.getTransactionParams().do()
      const transactions: algosdk.Transaction[] = []

      // Transaction 1: Buyer pays Seller
      transactions.push(
        algosdk.makePaymentTxnWithSuggestedParamsFromObject({
          from: buyer.addr,
          to: seller.addr,
          amount: price,
          suggestedParams
        })
      )

      // Transaction 2: Seller transfers asset to Buyer
      transactions.push(
        algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
          from: seller.addr,
          to: buyer.addr,
          assetIndex: assetId,
          amount: 1n, // NFT = 1 unit
          suggestedParams
        })
      )

      // Transaction 3 (optional): Buyer pays royalty
      if (royaltyRecipient && royaltyAmount && royaltyAmount > 0) {
        if (!algosdk.isValidAddress(royaltyRecipient)) {
          throw new Error(`Invalid royalty recipient: ${royaltyRecipient}`)
        }

        transactions.push(
          algosdk.makePaymentTxnWithSuggestedParamsFromObject({
            from: buyer.addr,
            to: royaltyRecipient,
            amount: royaltyAmount,
            note: new TextEncoder().encode('Royalty payment'),
            suggestedParams
          })
        )
      }

      // Group all transactions
      algosdk.assignGroupID(transactions)

      // Sign transactions
      const signedTxns: Uint8Array[] = []
      signedTxns.push(transactions[0]!.signTxn(buyer.sk)) // Payment
      signedTxns.push(transactions[1]!.signTxn(seller.sk)) // Asset transfer
      if (transactions.length === 3) {
        signedTxns.push(transactions[2]!.signTxn(buyer.sk)) // Royalty
      }

      // Submit
      const { txId } = await this.client.client.algod.sendRawTransaction(signedTxns).do()
      await algosdk.waitForConfirmation(this.client.client.algod, txId, 4)

      const royaltyInfo = royaltyAmount ? ` + ${royaltyAmount} royalty` : ''
      console.log(`✅ Marketplace purchase completed: Asset ${assetId} for ${price} microAlgos${royaltyInfo}`)
      
      return txId
    } catch (error) {
      throw new Error(`Marketplace purchase failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Execute multi-party atomic transaction
   * Useful for complex marketplace scenarios (e.g., bundle sales, splits)
   * 
   * @param transactions - Array of unsigned transactions
   * @param signers - Array of accounts to sign (in order)
   */
  async executeAtomicGroup(
    transactions: algosdk.Transaction[],
    signers: algosdk.Account[]
  ): Promise<string> {
    try {
      if (transactions.length === 0) throw new Error('No transactions provided')
      if (transactions.length !== signers.length) {
        throw new Error('Number of transactions must match number of signers')
      }

      // Group transactions
      algosdk.assignGroupID(transactions)

      // Sign each transaction
      const signedTxns = transactions.map((txn, i) => txn.signTxn(signers[i]!.sk))

      // Submit
      const { txId } = await this.client.client.algod.sendRawTransaction(signedTxns).do()
      await algosdk.waitForConfirmation(this.client.client.algod, txId, 4)

      console.log(`✅ Atomic group executed: ${transactions.length} transactions`)
      return txId
    } catch (error) {
      throw new Error(`Atomic group execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Wait for transaction confirmation
   * 
   * @param txId - Transaction ID to wait for
   * @param rounds - Number of rounds to wait (default: 4)
   */
  async waitForConfirmation(txId: string, rounds: number = 4) {
    try {
      return await algosdk.waitForConfirmation(this.client.client.algod, txId, rounds)
    } catch (error) {
      throw new Error(`Transaction confirmation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get pending transaction information
   * 
   * @param txId - Transaction ID
   */
  async getPendingTransaction(txId: string) {
    try {
      return await this.client.client.algod.pendingTransactionInformation(txId).do()
    } catch (error) {
      throw new Error(`Failed to get pending transaction: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}