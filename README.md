# EIP-7702 dApp

A React-based decentralized application that demonstrates EIP-7702 (Set EOA account code) functionality with MetaMask integration.

## Features

- ✅ MetaMask wallet connection
- ✅ Delegation contract selection
- ✅ Batch transaction builder
- ✅ EIP-7702 transaction execution
- ✅ Transaction management interface

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- MetaMask browser extension
- An Ethereum testnet with EIP-7702 support

## Installation

1. Clone or create the project directory
2. Install dependencies:

```bash
npm install
# or
yarn install
```

## Usage

1. Start the development server:

```bash
npm start
# or
yarn start
```

2. Open your browser and navigate to `http://localhost:3000`

3. Connect your MetaMask wallet

4. Configure the delegation contract address

5. Add batch transactions (address and calldata pairs)

6. Execute the EIP-7702 transaction

## How It Works

### EIP-7702 Overview

EIP-7702 allows Externally Owned Accounts (EOAs) to temporarily set contract code, enabling:
- Account abstraction features
- Batch transaction execution
- Advanced wallet functionality

### Application Flow

1. **Wallet Connection**: Connect to MetaMask using the browser provider
2. **Delegation Setup**: Specify the contract that will act as your account's code
3. **Batch Building**: Add multiple transactions to execute in a single batch
4. **Transaction Execution**: Send a Type-4 transaction that:
   - Sets the delegation contract as your account code
   - Executes all batched transactions atomically

### Transaction Structure

The EIP-7702 transaction includes:
- `type: 4` (EIP-7702 transaction type)
- `authorizationList`: Contains the signed authorization for code delegation
- Batch execution happens within the delegated contract

## Important Notes

### Current Implementation Status

This is a **demonstration implementation** that shows the structure and flow of EIP-7702 transactions. For production use, you would need:

1. **EIP-7702 Compatible Network**: A blockchain that supports EIP-7702 transactions
2. **Updated MetaMask**: Version that supports Type-4 transactions
3. **Delegation Contract**: A smart contract that can handle batch execution
4. **Provider Support**: Web3 provider with EIP-7702 transaction support

### Security Considerations

- Always verify delegation contracts before use
- Understand that delegation gives the contract control over your account
- Test thoroughly on testnets before mainnet deployment
- Be aware of gas limits and transaction costs

### Development Notes

The current implementation:
- Structures the EIP-7702 transaction correctly
- Handles authorization signing
- Provides a complete UI for batch management
- Logs transaction details for debugging

## File Structure

```
eip-7702-dapp/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.js             # Main application component
│   └── index.js           # React entry point
├── package.json           # Dependencies and scripts
├── webpack.config.js      # Webpack configuration
├── .babelrc              # Babel configuration
└── README.md             # This file
```

## Available Scripts

- `npm start` / `yarn start`: Start development server
- `npm run build` / `yarn build`: Build for production
- `npm run dev` / `yarn dev`: Alias for start

## Troubleshooting

### Common Issues

1. **MetaMask Not Detected**
   - Ensure MetaMask is installed and enabled
   - Check browser compatibility

2. **Transaction Fails**
   - Verify network supports EIP-7702
   - Check gas limits and fees
   - Validate contract addresses

3. **Build Errors**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility

### Development Tips

- Use browser developer tools to inspect transaction details
- Test with small gas limits initially
- Monitor console logs for debugging information
- Verify contract ABIs match expected interfaces

## Contributing

This is a demonstration project. For production use, consider:
- Enhanced error handling
- Transaction fee estimation
- Network compatibility checks
- Advanced UI/UX improvements
- Comprehensive testing suite

## License

MIT License - see LICENSE file for details

## Disclaimer

This is experimental software demonstrating EIP-7702 functionality. Use at your own risk and thoroughly test before any production deployment.