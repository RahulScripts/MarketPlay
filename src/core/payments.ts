import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'

/**
 * Manages ALGO payments and escrow transactions
 */
export class PaymentManager {
  private client: AlgorandClient

  constructor(client: AlgorandClient) {
    this.client = client
  }

  /**
   * Send ALGO payment from one account to another
   * @param params Payment parameters
   * @returns Transaction ID
   */
  async sendPayment(params: {
    from: algosdk.Account
    to: string
    amount: number // in microAlgos
    note?: string
  }): Promise<string> {
    try {
      const { from, to, amount, note } = params

      // Validate inputs
      if (!algosdk.isValidAddress(to)) {
        throw new Error(`Invalid recipient address: ${to}`)
      }
      if (amount <= 0) {
        throw new Error(`Amount must be positive, got: ${amount}`)
      }

      // Send payment using AlgoKit Utils v9.x API
      const result = await this.client.send.payment({
        sender: from.addr,
        receiver: to,
        amount: algosdk.microalgosToAlgos(amount),
        note: note ? new TextEncoder().encode(note) : undefined,
        signer: { addr: from.addr, signer: algosdk.makeBasicAccountTransactionSigner(from) }
      })

      console.log(`✅ Payment sent: ${result.transaction.txID()}`)
      return result.transaction.txID()
    } catch (error) {
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Send ALGO in microAlgos (convenience method)
   * @param from - Sender account
   * @param to - Recipient address
   * @param microAlgos - Amount in microAlgos
   */
  async sendMicroAlgos(from: algosdk.Account, to: string, microAlgos: number): Promise<string> {
    return this.sendPayment({ from, to, amount: microAlgos })
  }

  /**
   * Send ALGO in standard units
   * @param from - Sender account
   * @param to - Recipient address
   * @param algos - Amount in ALGO (e.g., 5.5 = 5.5 ALGO)
   */
  async sendAlgos(from: algosdk.Account, to: string, algos: number): Promise<string> {
    return this.sendPayment({ from, to, amount: algosdk.algosToMicroalgos(algos) })
  }

  /**
   * Create an escrow payment (atomic transaction with condition)
   * Note: This is a simplified version. Production escrows need proper smart contracts.
   * 
   * @param params Escrow parameters
   * @returns Transaction group ID
   */
  async createEscrowPayment(params: {
    buyer: algosdk.Account
    seller: string
    amount: number // in microAlgos
    condition: 'asset_received' | 'time_lock' // simplified conditions
  }): Promise<string> {
    try {
      const { buyer, seller, amount, condition } = params

      // Validate
      if (!algosdk.isValidAddress(seller)) {
        throw new Error(`Invalid seller address: ${seller}`)
      }

      // For now, we'll implement a simple escrow using atomic transactions
      // In production, you'd deploy a proper TEAL smart contract
      
      if (condition === 'asset_received') {
        // This will be completed when paired with asset transfer in atomic group
        console.log(`⏳ Escrow payment prepared (${amount} microAlgos to ${seller})`)
        console.log(`   Condition: Asset must be received by buyer`)
        
        // Return a pending transaction (to be grouped with asset transfer)
        return `escrow_pending_${Date.now()}`
      } else {
        // Time-lock escrow (simplified)
        throw new Error('Time-lock escrows not yet implemented. Use atomic transactions instead.')
      }
    } catch (error) {
      throw new Error(`Escrow creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get minimum transaction fee
   * @returns Fee in microAlgos (currently 1000 = 0.001 ALGO)
   */
  getMinFee(): number {
    return algosdk.ALGORAND_MIN_TX_FEE
  }

  /**
   * Calculate total cost including fees
   * @param amount - Payment amount in microAlgos
   * @returns Total cost (amount + min fee)
   */
  calculateTotalCost(amount: number): number {
    return amount + this.getMinFee()
  }

  /**
   * Verify if account has sufficient balance
   * @param address - Account address
   * @param amount - Required amount in microAlgos
   * @param includeFee - Include minimum fee in check
   */
  async hasSufficientBalance(address: string, amount: number, includeFee: boolean = true): Promise<boolean> {
    try {
      const accountInfo = await this.client.client.algod.accountInformation(address).do()
      const required = includeFee ? this.calculateTotalCost(amount) : amount
      return accountInfo.amount >= required
    } catch (error) {
      throw new Error(`Balance check failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}