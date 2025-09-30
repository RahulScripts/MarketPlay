import { AlgorandClient } from '@algorandfoundation/algokit-utils'

export class PaymentManager {
  private client: AlgorandClient

  constructor(client: AlgorandClient) {
    this.client = client
  }

  async sendPayment(from: string, to: string, amount: number) {
    return this.client.transactions.payment({
      from,
      to,
      amount,
    })
  }

  async escrowPayment(from: string, escrow: string, to: string, amount: number) {
    // funds sent to escrow account
    await this.client.transactions.payment({ from, to: escrow, amount })
    // later, escrow releases funds to seller
    return this.client.transactions.payment({ from: escrow, to, amount })
  }
}
