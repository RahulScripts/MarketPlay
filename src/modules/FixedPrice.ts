import { AssetManager } from '../core/assets'
import { PaymentManager } from '../core/payments'

export class FixedPriceMarketplace {
  constructor(
    private assets: AssetManager,
    private payments: PaymentManager
  ) {}

  async listAsset(assetId: number, seller: string, price: number) {
    return { assetId, seller, price }
  }

  async buyAsset(listing: { assetId: number; seller: string; price: number }, buyer: string) {
    // transfer ALGO payment
    await this.payments.sendPayment(buyer, listing.seller, listing.price)
    // transfer ASA/NFT
    await this.assets.transferAsset(listing.assetId, listing.seller, buyer, 1)
  }
}
