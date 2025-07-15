import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { createBundlerClient } from "viem/account-abstraction";
import { 
  createPublicClient, 
  createWalletClient, 
  http, 
  parseEther,
  zeroAddress 
} from 'viem';
import { sepolia } from 'viem/chains';
import { custom } from 'viem';
import {
  Implementation,
  toMetaMaskSmartAccount,
  getDeleGatorEnvironment,
} from '@metamask/delegation-toolkit';

const App = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [publicClient, setPublicClient] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const [bundlerClient, setBundlerClient] = useState(null);
  const [smartAccount, setSmartAccount] = useState(null);
  const [delegationContract, setDelegationContract] = useState('');
  const [batchTransactions, setBatchTransactions] = useState([]);
  const [newTxAddress, setNewTxAddress] = useState('');
  const [newTxCalldata, setNewTxCalldata] = useState('');
  const [newTxValue, setNewTxValue] = useState('0');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isDelegated, setIsDelegated] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      setStatus({ type: 'error', message: 'MetaMask is not installed!' });
      return;
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      const web3Signer = await web3Provider.getSigner();
      
      // Set up Viem clients
      const viemPublicClient = createPublicClient({
        chain: sepolia,
        transport: http(),
      });

      const viemWalletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
      });

      // Set up bundler client (you'll need to replace with your bundler URL)
      const viemBundlerClient = createBundlerClient({
        client: viemPublicClient,
        transport: http("https://sepolia.bundler.example.com"), // Replace with actual bundler
      });
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setPublicClient(viemPublicClient);
      setWalletClient(viemWalletClient);
      setBundlerClient(viemBundlerClient);
      setAccount(accounts[0]);
      setStatus({ type: 'success', message: `Connected to ${accounts[0]}` });
      
      // Set default delegation contract to MetaMask's EIP7702StatelessDeleGator
      const environment = getDeleGatorEnvironment(sepolia.id);
      setDelegationContract(environment.implementations.EIP7702StatelessDeleGatorImpl);
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setProvider(null);
          setSigner(null);
          setPublicClient(null);
          setWalletClient(null);
          setBundlerClient(null);
          setSmartAccount(null);
          setIsDelegated(false);
          setStatus({ type: 'warning', message: 'Wallet disconnected' });
        } else {
          setAccount(accounts[0]);
          setStatus({ type: 'success', message: `Connected to ${accounts[0]}` });
        }
      });
      
    } catch (error) {
      setStatus({ type: 'error', message: `Failed to connect: ${error.message}` });
    }
  };

  // Add a new batch transaction
  const addBatchTransaction = () => {
    if (!newTxAddress || !newTxCalldata) {
      setStatus({ type: 'error', message: 'Please provide both address and calldata' });
      return;
    }

    // Basic validation
    if (!ethers.isAddress(newTxAddress)) {
      setStatus({ type: 'error', message: 'Invalid address format' });
      return;
    }

    if (!newTxCalldata.startsWith('0x')) {
      setStatus({ type: 'error', message: 'Calldata must start with 0x' });
      return;
    }

    // Validate value
    try {
      parseEther(newTxValue || '0');
    } catch (error) {
      setStatus({ type: 'error', message: 'Invalid value format' });
      return;
    }

    const newTransaction = {
      id: Date.now(),
      address: newTxAddress,
      calldata: newTxCalldata,
      value: newTxValue || '0'
    };

    setBatchTransactions([...batchTransactions, newTransaction]);
    setNewTxAddress('');
    setNewTxCalldata('');
    setNewTxValue('0');
    setStatus({ type: 'success', message: 'Transaction added to batch' });
  };

  // Remove a batch transaction
  const removeBatchTransaction = (id) => {
    setBatchTransactions(batchTransactions.filter(tx => tx.id !== id));
    setStatus({ type: 'success', message: 'Transaction removed from batch' });
  };

  // Create EIP-7702 delegation
  const createDelegation = async () => {
    if (!walletClient || !delegationContract) {
      setStatus({ type: 'error', message: 'Please connect wallet and set delegation contract' });
      return;
    }

    if (!ethers.isAddress(delegationContract)) {
      setStatus({ type: 'error', message: 'Invalid delegation contract address' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'warning', message: 'Creating EIP-7702 delegation...' });

    try {
      // Create authorization for delegation
      const authorization = await walletClient.signAuthorization({
        account: account,
        contractAddress: delegationContract,
        executor: "self",
      });

      // Send EIP-7702 transaction with authorization
      const hash = await walletClient.sendTransaction({
        authorizationList: [authorization],
        data: "0x",
        to: zeroAddress,
      });

      setStatus({ type: 'success', message: `Delegation created! Transaction hash: ${hash}` });
      
      // Wait for transaction confirmation
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Create smart account instance
      const smartAccountInstance = await toMetaMaskSmartAccount({
        client: publicClient,
        implementation: Implementation.Stateless7702,
        address: account,
        signatory: { walletClient },
      });
      
      setSmartAccount(smartAccountInstance);
      setIsDelegated(true);
      setStatus({ type: 'success', message: 'EOA successfully upgraded to smart account!' });
      
    } catch (error) {
      setStatus({ type: 'error', message: `Delegation failed: ${error.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>EIP-7702 dApp</h1>
      
      {status.message && (
        <div className={`status ${status.type}`}>
          {status.message}
        </div>
      )}

      {/* Wallet Connection */}
      <div className="section">
        <h3>Wallet Connection</h3>
        {account ? (
          <div>
            <p>Connected: {account}</p>
            <button className="connected" disabled>
              ✓ Connected
            </button>
          </div>
        ) : (
          <button onClick={connectWallet}>
            Connect MetaMask
          </button>
        )}
      </div>

      {/* Delegation Contract */}
      <div className="section">
        <h3>Delegation Contract</h3>
        <input
          type="text"
          placeholder="Enter delegation contract address (0x...)"
          value={delegationContract}
          onChange={(e) => setDelegationContract(e.target.value)}
          disabled={!account}
        />
        <p style={{ fontSize: '12px', color: '#666' }}>
          This contract will be set as the code for your account via EIP-7702
        </p>
      </div>

      {/* Batch Transactions */}
      <div className="section">
        <h3>Batch Transactions</h3>
        
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Transaction address (0x...)"
            value={newTxAddress}
            onChange={(e) => setNewTxAddress(e.target.value)}
            disabled={!account}
          />
          <input
            type="text"
            placeholder="Value in ETH (e.g., 0.1)"
            value={newTxValue}
            onChange={(e) => setNewTxValue(e.target.value)}
            disabled={!account}
          />
          <input
            type="text"
            placeholder="Calldata (0x...)"
            value={newTxCalldata}
            onChange={(e) => setNewTxCalldata(e.target.value)}
            disabled={!account}
          />
          <button onClick={addBatchTransaction} disabled={!account}>
            Add Transaction
          </button>
        </div>

        {batchTransactions.length > 0 && (
          <div>
            <h4>Batched Transactions ({batchTransactions.length}):</h4>
            {batchTransactions.map((tx) => (
              <div key={tx.id} className="batch-item">
                <h4>Transaction #{tx.id}</h4>
                <p><strong>Address:</strong> {tx.address}</p>
                <p><strong>Value:</strong> {tx.value} ETH</p>
                <p><strong>Calldata:</strong> {tx.calldata}</p>
                <button 
                  onClick={() => removeBatchTransaction(tx.id)}
                  style={{ backgroundColor: '#dc3545' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Execute Transaction */}
      <div className="section">
        <h3>EIP-7702 Operations</h3>
        
        {!isDelegated ? (
          <div>
            <button
              onClick={createDelegation}
              disabled={!account || !delegationContract || isLoading}
              style={{ backgroundColor: '#007bff', fontSize: '16px', padding: '12px 24px' }}
            >
              {isLoading ? 'Creating Delegation...' : 'Create EIP-7702 Delegation'}
            </button>
            <p style={{ fontSize: '12px', color: '#666' }}>
              This will upgrade your EOA to a smart account using EIP-7702
            </p>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Smart Account Active</span>
              <p style={{ fontSize: '12px', color: '#666' }}>
                Your EOA has been upgraded to a smart account. You can now execute batch transactions.
              </p>
            </div>
            
            <button
              onClick={executeBatchTransactions}
              disabled={!smartAccount || batchTransactions.length === 0 || isLoading}
              style={{ backgroundColor: '#28a745', fontSize: '18px', padding: '15px 30px' }}
            >
              {isLoading ? 'Executing Batch...' : 'Execute Batch Transactions'}
            </button>
            <p style={{ fontSize: '12px', color: '#666' }}>
              Execute all batched transactions in a single user operation
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;