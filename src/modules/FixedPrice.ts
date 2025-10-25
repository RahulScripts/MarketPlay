import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import algosdk from 'algosdk'
import { AssetManager } from '../core/assets'
import { PaymentManager } from '../core/payments'
import { AtomicTransactionManager } from '../core/atomic'

/**
 * Listing data structure
 */
export interface Listing {
  id: string
  assetId: number
  seller: string
  price: number // microAlgos
  royaltyRecipient?: string
  royaltyPercentage?: number // 0-100
  createdAt: number
  status: 'active' | 'sold' | 'cancelled'
}

/**
 * Fixed-price marketplace implementation
 * Handles listing, buying, and cancelling NFT/token sales
 */
export class FixedPriceMarketplace {
  private client: AlgorandClient
  private assets: AssetManager
  private payments: PaymentManager
  private atomic: AtomicTransactionManager
  private listings: Map<string, Listing> = new Map()

  constructor(client: AlgorandClient) {
    this.client = client
    this.assets = new AssetManager(client)
    this.payments = new PaymentManager(client)
    this.atomic = new AtomicTransactionManager(client)
  }

  /**
   * List an asset for sale at fixed price
   * 
   * @param params Listing parameters
   * @returns Listing ID
   */
  async listAsset(params: {
    seller: algosdk.Account
    assetId: number
    price: number // microAlgos
    royaltyRecipient?: string
    royaltyPercentage?: number
  }): Promise<string> {
    const { seller, assetId, price, royaltyRecipient, royaltyPercentage } = params

    // Validate inputs
    if (price <= 0) throw new Error('Price must be positive')
    if (royaltyPercentage && (royaltyPercentage < 0 || royaltyPercentage > 100)) {
      throw new Error('Royalty percentage must be 0-100')
    }
    if (royaltyRecipient && !algosdk.isValidAddress(royaltyRecipient)) {
      throw new Error(`Invalid royalty recipient: ${royaltyRecipient}`)
    }

    // Verify seller owns the asset
    const holding = await this.assets.getAssetHolding(seller.addr, assetId)
    if (!holding || holding.amount === 0) {
      throw new Error(`Seller does not own asset ${assetId}`)
    }

    // Create listing
    const listingId = `listing_${assetId}_${Date.now()}`
    const listing: Listing = {
      id: listingId,
      assetId,
      seller: seller.addr,
      price,
      royaltyRecipient,
      royaltyPercentage,
      createdAt: Date.now(),
      status: 'active'
    }

    this.listings.set(listingId, listing)
    console.log(`✅ Asset ${assetId} listed for ${price} microAlgos (ID: ${listingId})`)
    
    return listingId
  }

  /**
   * Purchase a listed asset
   * Uses atomic transaction to ensure secure swap
   * 
   * @param params Purchase parameters
   * @returns Transaction ID
   */
  async buyAsset(params: {
    buyer: algosdk.Account
    listingId: string
    sellerAccount: algosdk.Account // Seller must co-sign
  }): Promise<string> {
    const { buyer, listingId, sellerAccount } = params

    // Get listing
    const listing = this.listings.get(listingId)
    if (!listing) throw new Error(`Listing ${listingId} not found`)
    if (listing.status !== 'active') throw new Error(`Listing ${listingId} is not active`)

    // Verify seller account matches listing
    if (sellerAccount.addr !== listing.seller) {
      throw new Error('Seller account does not match listing')
    }

    // Check buyer has opted into asset
    const hasOptedIn = await this.client.client.algod
      .accountInformation(buyer.addr)
      .do()
      .then((info) => 
        info.assets?.some((a: { 'asset-id': number }) => a['asset-id'] === listing.assetId)
      )

    if (!hasOptedIn) {
      // Auto opt-in for buyer
      console.log(`⏳ Buyer opting into asset ${listing.assetId}...`)
      await this.assets.optIn(buyer, listing.assetId)
    }

    // Calculate royalty if applicable
    let royaltyAmount = 0
    if (listing.royaltyRecipient && listing.royaltyPercentage) {
      royaltyAmount = Math.floor((listing.price * listing.royaltyPercentage) / 100)
    }

    // Check buyer has sufficient balance
    const totalCost = listing.price + royaltyAmount + algosdk.ALGORAND_MIN_TX_FEE * 2
    const hasFunds = await this.payments.hasSufficientBalance(buyer.addr, totalCost, false)
    if (!hasFunds) {
      throw new Error(`Insufficient balance. Need ${totalCost} microAlgos (including fees)`)
    }

    // Execute atomic swap
    console.log(`⏳ Executing atomic purchase...`)
    const txId = await this.atomic.marketplacePurchase({
      buyer,
      seller: sellerAccount,
      assetId: listing.assetId,
      price: listing.price,
      royaltyRecipient: listing.royaltyRecipient,
      royaltyAmount
    })

    // Update listing status
    listing.status = 'sold'
    this.listings.set(listingId, listing)

    console.log(`✅ Purchase completed! Asset ${listing.assetId} sold for ${listing.price} microAlgos`)
    return txId
  }

  /**
   * Cancel an active listing
   * 
   * @param seller - Seller account
   * @param listingId - Listing to cancel
   */
  async cancelListing(seller: algosdk.Account, listingId: string): Promise<void> {
    const listing = this.listings.get(listingId)
    if (!listing) throw new Error(`Listing ${listingId} not found`)
    if (listing.seller !== seller.addr) throw new Error('Only seller can cancel listing')
    if (listing.status !== 'active') throw new Error('Listing is not active')

    listing.status = 'cancelled'
    this.listings.set(listingId, listing)
    
    console.log(`✅ Listing ${listingId} cancelled`)
  }

  /**
   * Get listing by ID
   * 
   * @param listingId - Listing ID
   */
  getListing(listingId: string): Listing | undefined {
    return this.listings.get(listingId)
  }

  /**
   * Get all active listings
   */
  getActiveListings(): Listing[] {
    return Array.from(this.listings.values()).filter(l => l.status === 'active')
  }

  /**
   * Get listings by seller
   * 
   * @param sellerAddress - Seller's address
   */
  getListingsBySeller(sellerAddress: string): Listing[] {
    return Array.from(this.listings.values()).filter(l => l.seller === sellerAddress)
  }

  /**
   * Get listings by asset
   * 
   * @param assetId - Asset ID
   */
  getListingsByAsset(assetId: number): Listing[] {
    return Array.from(this.listings.values()).filter(l => l.assetId === assetId)
  }

  /**
   * Calculate total cost for buyer (including royalties)
   * 
   * @param listingId - Listing ID
   * @returns Total cost in microAlgos
   */
  calculateTotalCost(listingId: string): number {
    const listing = this.listings.get(listingId)
    if (!listing) throw new Error(`Listing ${listingId} not found`)

    let total = listing.price
    
    if (listing.royaltyRecipient && listing.royaltyPercentage) {
      total += Math.floor((listing.price * listing.royaltyPercentage) / 100)
    }

    // Add transaction fees (2 transactions minimum)
    total += algosdk.ALGORAND_MIN_TX_FEE * 2

    return total
  }

  /**
   * Helper: Convert ALGO to microAlgos
   */
  static algosToMicroalgos(algos: number): number {
    return algosdk.algosToMicroalgos(algos)
  }

  /**
   * Helper: Convert microAlgos to ALGO
   */
  static microalgosToAlgos(microAlgos: number): number {
    return algosdk.microalgosToAlgos(microAlgos)
  }
}