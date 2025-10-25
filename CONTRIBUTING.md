# Contributing to MarketPlay

Thank you for your interest in contributing to MarketPlay! We welcome contributions from developers of all skill levels.

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- Git
- Basic understanding of TypeScript and Algorand

### Setup Development Environment

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/MarketPlay.git
   cd MarketPlay
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## 📝 Development Workflow

### Branch Naming Convention
- Feature: `feature/your-feature-name`
- Bug fix: `fix/bug-description`
- Documentation: `docs/what-you-changed`
- Refactor: `refactor/what-you-refactored`

### Making Changes

1. **Create a new branch**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features
   - Update documentation

3. **Test your changes**
   ```bash
   npm test
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add awesome new feature"
   ```

   Use conventional commit messages:
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation changes
   - `test:` adding tests
   - `refactor:` code refactoring
   - `chore:` maintenance tasks

5. **Push and create Pull Request**
   ```bash
   git push origin feature/my-new-feature
   ```

## 🎯 Contribution Guidelines

### Code Style
- Use TypeScript strict mode
- Follow existing code formatting
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Documentation
- Update README.md if adding new features
- Add examples for new functionality
- Document all public APIs with JSDoc
- Include type definitions

### Testing
- Write tests for new features
- Ensure all tests pass before submitting
- Test on testnet before mainnet
- Include both unit and integration tests

### Examples
When adding new features, consider adding:
- Basic usage example in documentation
- Complete working example in `examples/` folder
- Edge case demonstrations

## 🐛 Reporting Bugs

### Before Reporting
- Check existing issues to avoid duplicates
- Test on the latest version
- Gather relevant information (OS, Node version, etc.)

### Bug Report Template
```markdown
**Description**
Clear description of the bug

**To Reproduce**
1. Step 1
2. Step 2
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., macOS 13]
- Node.js: [e.g., 18.0.0]
- MarketPlay: [e.g., 1.0.0]
- Network: [mainnet/testnet/localnet]

**Additional Context**
Any other relevant information
```

## 💡 Feature Requests

We welcome feature suggestions! Please:
1. Check if the feature is already requested
2. Clearly describe the use case
3. Explain how it benefits users
4. Consider implementation complexity

## 🔍 Code Review Process

### What We Look For
- ✅ Code follows project style
- ✅ Tests are included and passing
- ✅ Documentation is updated
- ✅ No breaking changes (or clearly marked)
- ✅ Commit messages are clear

### Timeline
- Initial review within 48 hours
- Follow-up reviews within 24 hours
- Merge when approved by maintainer

## 📋 Pull Request Checklist

Before submitting, ensure:
- [ ] Code builds successfully (`npm run build`)
- [ ] All tests pass (`npm test`)
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] Examples added/updated if needed
- [ ] Commit messages follow convention
- [ ] No console.log or debugging code
- [ ] Types are properly defined

## 🎓 First Time Contributors

Welcome! Here are some good starting points:
- Fix typos in documentation
- Add examples for existing features
- Improve error messages
- Write additional tests
- Check issues labeled `good-first-issue`

## 📚 Resources

- [Algorand Developer Docs](https://developer.algorand.org/)
- [AlgoKit Utils Docs](https://github.com/algorandfoundation/algokit-utils-ts)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Jest Testing Docs](https://jestjs.io/docs/getting-started)

## 🤝 Community

- **GitHub Discussions**: Ask questions and share ideas
- **Discord**: Join our community server
- **Twitter**: Follow [@MarketPlaySDK](https://twitter.com/marketplaysdk)

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution, no matter how small, helps make MarketPlay better for everyone!

---

**Questions?** Open an issue or reach out on Discord!
