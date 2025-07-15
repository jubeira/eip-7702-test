import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const App = () => {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [delegationContract, setDelegationContract] = useState('');
  const [batchTransactions, setBatchTransactions] = useState([]);
  const [newTxAddress, setNewTxAddress] = useState('');
  const [newTxCalldata, setNewTxCalldata] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

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
      
      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(accounts[0]);
      setStatus({ type: 'success', message: `Connected to ${accounts[0]}` });
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          setAccount(null);
          setProvider(null);
          setSigner(null);
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

    const newTransaction = {
      id: Date.now(),
      address: newTxAddress,
      calldata: newTxCalldata
    };

    setBatchTransactions([...batchTransactions, newTransaction]);
    setNewTxAddress('');
    setNewTxCalldata('');
    setStatus({ type: 'success', message: 'Transaction added to batch' });
  };

  // Remove a batch transaction
  const removeBatchTransaction = (id) => {
    setBatchTransactions(batchTransactions.filter(tx => tx.id !== id));
    setStatus({ type: 'success', message: 'Transaction removed from batch' });
  };

  // Send EIP-7702 transaction
  const sendEIP7702Transaction = async () => {
    if (!signer || !delegationContract || batchTransactions.length === 0) {
      setStatus({ type: 'error', message: 'Please connect wallet, set delegation contract, and add batch transactions' });
      return;
    }

    if (!ethers.isAddress(delegationContract)) {
      setStatus({ type: 'error', message: 'Invalid delegation contract address' });
      return;
    }

    setIsLoading(true);
    setStatus({ type: 'warning', message: 'Preparing EIP-7702 transaction...' });

    try {
      // Get the current nonce
      const nonce = await provider.getTransactionCount(account);
      
      // Prepare the authorization for EIP-7702
      const authorization = {
        chainId: (await provider.getNetwork()).chainId,
        address: delegationContract,
        nonce: nonce
      };

      // Sign the authorization
      const authSignature = await signer.signMessage(
        ethers.solidityPackedKeccak256(
          ['uint256', 'address', 'uint256'],
          [authorization.chainId, authorization.address, authorization.nonce]
        )
      );

      // Parse the signature
      const sig = ethers.Signature.from(authSignature);
      
      // Create the EIP-7702 transaction
      const eip7702Transaction = {
        type: 4, // EIP-7702 transaction type
        to: account, // Self-delegation
        value: 0,
        data: '0x', // Empty data for delegation setup
        gasLimit: 500000,
        maxFeePerGas: ethers.parseUnits('20', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
        nonce: nonce,
        authorizationList: [{
          chainId: authorization.chainId,
          address: authorization.address,
          nonce: authorization.nonce,
          v: sig.v,
          r: sig.r,
          s: sig.s
        }]
      };

      setStatus({ type: 'warning', message: 'Sending delegation transaction...' });
      
      // Note: This is a simplified example. In practice, you would need to:
      // 1. Use a proper EIP-7702 compatible wallet/provider
      // 2. Handle the batch execution within the delegated contract
      // 3. Ensure the delegation contract supports batch operations
      
      // For demonstration, we'll show how the transaction would be structured
      console.log('EIP-7702 Transaction:', eip7702Transaction);
      console.log('Batch Transactions:', batchTransactions);
      
      // This would be the actual transaction sending in a real implementation
      // const txResponse = await signer.sendTransaction(eip7702Transaction);
      // const receipt = await txResponse.wait();
      
      setStatus({ 
        type: 'success', 
        message: `EIP-7702 transaction prepared successfully! Check console for details. In a real implementation, this would execute ${batchTransactions.length} batched transactions.`
      });
      
    } catch (error) {
      setStatus({ type: 'error', message: `Transaction failed: ${error.message}` });
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
        <h3>Execute EIP-7702 Transaction</h3>
        <button
          onClick={sendEIP7702Transaction}
          disabled={!account || !delegationContract || batchTransactions.length === 0 || isLoading}
          style={{ backgroundColor: '#28a745', fontSize: '18px', padding: '15px 30px' }}
        >
          {isLoading ? 'Processing...' : 'Send EIP-7702 Transaction'}
        </button>
        <p style={{ fontSize: '12px', color: '#666' }}>
          This will set the delegation contract as your account code and execute all batched transactions
        </p>
      </div>
    </div>
  );
};

export default App;