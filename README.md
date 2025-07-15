# EIP-7702 dApp

A React-based decentralized application that demonstrates EIP-7702 (Set EOA account code) functionality with MetaMask integration using the official MetaMask Delegation Toolkit.

## Features

- ✅ MetaMask wallet connection with EIP-7702 support
- ✅ Automatic delegation contract setup (MetaMask's EIP7702StatelessDeleGator)
- ✅ Batch transaction builder with native token support
- ✅ Real EIP-7702 transaction execution
- ✅ Smart account creation and management
- ✅ User operation execution through bundler

## Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- MetaMask browser extension (latest version with EIP-7702 support)
- Access to Ethereum Sepolia testnet
- A bundler service URL (for user operations)

## Installation

1. Clone or create the project directory
2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. **Important**: Update the bundler URL in `src/App.js`:
```javascript
const viemBundlerClient = createBundlerClient({
  client: viemPublicClient,
  transport: http("https://your-bundler-url.com"), // Replace with your bundler
});
```

## Usage

1. Start the development server:

```bash
npm start
# or
yarn start
```

2. Open your browser and navigate to `http://localhost:3000`

3. Connect your MetaMask wallet (ensure you're on Sepolia testnet)

4. The delegation contract will be automatically set to MetaMask's EIP7702StatelessDeleGator

5. Add batch transactions with:
   - Target address
   - Value in ETH
   - Calldata

6. Create the EIP-7702 delegation (upgrades your EOA to smart account)

7. Execute batch transactions through the smart account

## How It Works

### EIP-7702 Implementation

This application uses MetaMask's official Delegation Toolkit to:

1. **Create Authorization**: Sign an EIP-7702 authorization to delegate your EOA to a smart contract
2. **Send Delegation Transaction**: Execute the authorization with a Type-4 transaction
3. **Upgrade to Smart Account**: Your EOA now has smart contract capabilities
4. **Execute User Operations**: Batch transactions through the ERC-4337 bundler

### MetaMask Delegation Toolkit

The app leverages:
- `@metamask/delegation-toolkit` for smart account creation
- `viem` for blockchain interactions
- MetaMask's EIP7702StatelessDeleGator contract
- ERC-4337 bundler for user operations

### Transaction Flow

1. **Authorization**: Create and sign EIP-7702 authorization
2. **Delegation**: Send transaction to set contract code for your EOA
3. **Smart Account**: Your EOA becomes a smart account
4. **Batch Execution**: Execute multiple transactions atomically

## Configuration

### Bundler Setup

You'll need a bundler service that supports ERC-4337 user operations. Popular options include:
- Pimlico
- Alchemy
- Stackup
- Biconomy

Replace the bundler URL in the code:
```javascript
transport: http("https://your-bundler-endpoint.com")
```

### Network Configuration

The app is configured for Sepolia testnet. To use other networks:
1. Update the chain import in `src/App.js`
2. Ensure the network supports EIP-7702
3. Update the delegation environment

## Delegation Contract

The app uses MetaMask's EIP7702StatelessDeleGator at address:
`0xBDBA7F921f8C8AFF014749Fc17324e832291bfB0` (Sepolia)

This contract provides:
- Stateless delegation (no storage of signer data)
- Batch transaction execution
- ERC-4337 compatibility
- Security-focused design

## Value Field Support

Each batch transaction now supports:
- **Address**: Target contract or EOA
- **Value**: Amount of ETH to send (e.g., "0.1" for 0.1# EIP-7702 dApp

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