# 🎯 MarketPlay

**An open-source TypeScript SDK for building Algorand-powered marketplaces**

MarketPlay simplifies blockchain development by providing a plug-and-play framework for creating decentralized marketplaces. No prior blockchain expertise required!

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Algorand](https://img.shields.io/badge/Algorand-SDK-00D4AA.svg)](https://developer.algorand.org/)

---

## ✨ Features

- 🎨 **NFT Management** - Create, transfer, and trade digital assets
- 💰 **Payment Processing** - Secure ALGO transfers with atomic transactions
- 🏪 **Fixed-Price Marketplace** - Ready-to-use marketplace module
- 🔐 **Atomic Swaps** - Guaranteed simultaneous asset/payment exchange
- 👥 **Account Management** - Simple account creation and funding
- 🛡️ **Beginner-Friendly** - High-level abstractions with full type safety
- 📚 **Comprehensive Examples** - Learn by doing with detailed tutorials

---

## 🚀 Quick Start

### Installation

```bash
npm install marketplay
```

### Basic Example: Create & Sell an NFT

```typescript
import { getAlgorandClient, AccountManager, AssetManager, FixedPriceMarketplace } from 'marketplay'

// Connect to testnet
const client = getAlgorandClient('testnet')
const accountMgr = new AccountManager(client)
const assetMgr = new AssetManager(client)
const marketplace = new FixedPriceMarketplace(client)

// Create accounts
const seller = accountMgr.createAccount()
const buyer = accountMgr.createAccount()

// Fund accounts (testnet only)
await accountMgr.fundFromDispenser(seller.account.addr, 10)
await accountMgr.fundFromDispenser(buyer.account.addr, 10)

// Create NFT
const nftId = await assetMgr.createNFT({
  creator: seller.account,
  name: 'My Cool NFT',
  unitName: 'COOL',
  url: 'https://example.com/nft.json'
})

// List for sale
const listingId = await marketplace.listAsset({
  seller: seller.account,
  assetId: nftId,
  price: FixedPriceMarketplace.algosToMicroalgos(5) // 5 ALGO
})

// Buy NFT (atomic swap ensures safety!)
await marketplace.buyAsset({
  buyer: buyer.account,
  listingId,
  sellerAccount: seller.account
})

console.log('✅ NFT purchased successfully!')
```

---

## 📦 Core Modules

### AccountManager
Create and manage Algorand accounts

```typescript
const accountMgr = new AccountManager(client)

// Create new account
const { account, mnemonic } = accountMgr.createAccount()

// Restore from mnemonic
const restored = accountMgr.fromMnemonic('your 25 word mnemonic...')

// Check balance
const balance = await accountMgr.getBalance(account.addr)

// Fund account (testnet/localnet)
await accountMgr.fundFromDispenser(account.addr, 10)
```

### AssetManager
Create and manage NFTs and tokens

```typescript
const assetMgr = new AssetManager(client)

// Create NFT
const nftId = await assetMgr.createNFT({
  creator: account,
  name: 'My Digital Art',
  unitName: 'ART',
  url: 'ipfs://...'
})

// Create fungible token
const tokenId = await assetMgr.createToken({
  creator: account,
  name: 'Game Token',
  unitName: 'GAME',
  total: 1_000_000n,
  decimals: 2
})

// Opt-in to receive asset
await assetMgr.optIn(account, nftId)

// Transfer asset
await assetMgr.transferAsset({
  from: seller,
  to: buyer.addr,
  assetId: nftId,
  amount: 1n
})
```

### PaymentManager
Send ALGO payments

```typescript
const paymentMgr = new PaymentManager(client)

// Send payment in ALGO
await paymentMgr.sendAlgos(from, to, 5.5) // 5.5 ALGO

// Send payment in microAlgos
await paymentMgr.sendMicroAlgos(from, to, 5_500_000)

// Check sufficient balance
const hasFunds = await paymentMgr.hasSufficientBalance(address, amount)
```

### AtomicTransactionManager
Execute atomic (all-or-nothing) transactions

```typescript
const atomicMgr = new AtomicTransactionManager(client)

// Atomic swap: Payment ↔ Asset
await atomicMgr.atomicSwap({
  buyer,
  seller,
  assetId: nftId,
  assetAmount: 1n,
  paymentAmount: 5_000_000 // 5 ALGO
})

// Marketplace purchase with royalties
await atomicMgr.marketplacePurchase({
  buyer,
  seller,
  assetId: nftId,
  price: 5_000_000,
  royaltyRecipient: creator.addr,
  royaltyAmount: 250_000 // 0.25 ALGO (5% royalty)
})
```

### FixedPriceMarketplace
Complete marketplace functionality

```typescript
const marketplace = new FixedPriceMarketplace(client)

// List asset
const listingId = await marketplace.listAsset({
  seller,
  assetId: nftId,
  price: FixedPriceMarketplace.algosToMicroalgos(10),
  royaltyRecipient: creator.addr,
  royaltyPercentage: 5 // 5%
})

// Buy asset
await marketplace.buyAsset({
  buyer,
  listingId,
  sellerAccount: seller
})

// Get listings
const activeListings = marketplace.getActiveListings()
const sellerListings = marketplace.getListingsBySeller(seller.addr)

// Cancel listing
await marketplace.cancelListing(seller, listingId)
```

---

## 🌐 Network Configuration

```typescript
import { getAlgorandClient } from 'marketplay'

// Mainnet (production)
const mainnet = getAlgorandClient('mainnet')

// Testnet (testing)
const testnet = getAlgorandClient('testnet')

// Localnet (development)
const localnet = getAlgorandClient('localnet')
```

---

## 📚 Examples

Run the included examples to learn:

```bash
# Simple payment example
npx ts-node examples/simple-payment.ts

# Full marketplace example
npx ts-node examples/basic-marketplace.ts
```

---

## 🔧 Development

### Prerequisites
- Node.js 18+
- TypeScript 5.9+

### Build
```bash
npm install
npm run build
```

### Testing
```bash
npm test
```

### Generate Documentation
```bash
npm run docs
```

---

## 🛣️ Roadmap

- [x] Core payment & asset management
- [x] Fixed-price marketplace
- [x] Atomic transactions
- [ ] Auction marketplace
- [ ] Escrow smart contracts (TEAL)
- [ ] NFT collections
- [ ] Lazy minting
- [ ] React UI components
- [ ] GraphQL API integration

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

## 🔗 Resources

- [Algorand Developer Portal](https://developer.algorand.org/)
- [AlgoKit Utils Documentation](https://github.com/algorandfoundation/algokit-utils-ts)
- [Algorand SDK Documentation](https://algorand.github.io/js-algorand-sdk/)
- [AlgoExplorer (Testnet)](https://testnet.algoexplorer.io/)

---

## 💬 Support

- GitHub Issues: [Report bugs or request features](https://github.com/RahulScripts/MarketPlay/issues)
- Discord: [Join our community](https://discord.gg/algorand)
- Twitter: [@MarketPlaySDK](https://twitter.com/marketplaysdk)

---

## 👨‍💻 Authors

- **Rahul Halli** - [@RahulScripts](https://github.com/RahulScripts)
- **Ritesh Katore** - [@riteshkatore](https://github.com/riteshkatore)

---

**Built with ❤️ on Algorand**
