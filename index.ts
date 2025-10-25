// Core modules
export { AccountManager } from './src/core/accounts'
export { AssetManager } from './src/core/assets'
export { PaymentManager } from './src/core/payments'
export { ContractManager } from './src/core/contracts'
export { AtomicTransactionManager } from './src/core/atomic'

// Marketplace modules
export { FixedPriceMarketplace, type Listing } from './src/modules/FixedPrice'

// Client utilities
export { getAlgorandClient, client, type Network } from './client'

// Re-export commonly used types from algosdk
export type { Account } from 'algosdk'

/**
 * MarketPlay SDK
 * 
 * A beginner-friendly SDK for building Algorand-powered marketplaces
 * 
 * @example Basic NFT Marketplace
 * ```typescript
 * import { getAlgorandClient, AccountManager, AssetManager, FixedPriceMarketplace } from 'marketplay'
 * 
 * const client = getAlgorandClient('testnet')
 * const accounts = new AccountManager(client)
 * const marketplace = new FixedPriceMarketplace(client)
 * 
 * // Create accounts
 * const seller = accounts.createAccount()
 * const buyer = accounts.createAccount()
 * 
 * // Fund accounts (testnet only)
 * await accounts.fundFromDispenser(seller.account.addr, 10)
 * await accounts.fundFromDispenser(buyer.account.addr, 10)
 * 
 * // Create and list NFT
 * const assets = new AssetManager(client)
 * const nftId = await assets.createNFT({
 *   creator: seller.account,
 *   name: 'My Cool NFT',
 *   unitName: 'COOL',
 *   url: 'ipfs://...'
 * })
 * 
 * const listingId = await marketplace.listAsset({
 *   seller: seller.account,
 *   assetId: nftId,
 *   price: marketplace.algosToMicroalgos(5) // 5 ALGO
 * })
 * 
 * // Buyer purchases NFT
 * await marketplace.buyAsset({
 *   buyer: buyer.account,
 *   listingId,
 *   sellerAccount: seller.account
 * })
 * ```
 */