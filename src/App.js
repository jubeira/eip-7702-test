import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Contract ABI for the delegation contract
const contractABI = [
  "function execute((address,uint256,bytes)[] calls) external payable",
  "function execute((address,uint256,bytes)[] calls, bytes signature) external payable",
  "function nonce() external view returns (uint256)"
];

// ERC20 ABI for token transfers
const erc20ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('');
  const [delegationContract, setDelegationContract] = useState('0x69e2C6013Bd8adFd9a54D7E0528b740bac4Eb87C'); // Default from QuickNode guide
  const [batchTransactions, setBatchTransactions] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [delegationStatus, setDelegationStatus] = useState(null);
  const [logs, setLogs] = useState([]);

  // Add log function
  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { message, type, timestamp }]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        addLog('MetaMask not detected', 'error');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await provider.getBalance(address);

      setProvider(provider);
      setSigner(signer);
      setAccount(address);
      setBalance(ethers.formatEther(balance));
      setIsConnected(true);

      addLog(`Connected to ${address}`, 'success');
      addLog(`Balance: ${ethers.formatEther(balance)} ETH`, 'info');

      // Check delegation status
      await checkDelegationStatus(address, provider);
    } catch (error) {
      addLog(`Connection failed: ${error.message}`, 'error');
    }
  };

  // Check delegation status
  const checkDelegationStatus = async (address = account, providerToUse = provider) => {
    try {
      const code = await providerToUse.getCode(address);
      
      if (code === "0x") {
        setDelegationStatus(null);
        addLog(`No delegation found for ${address}`, 'info');
        return null;
      }

      // Check if it's an EIP-7702 delegation (starts with 0xef0100)
      if (code.startsWith("0xef0100")) {
        const delegatedAddress = "0x" + code.slice(8);
        setDelegationStatus(delegatedAddress);
        addLog(`✅ Delegation found: ${delegatedAddress}`, 'success');
        return delegatedAddress;
      } else {
        setDelegationStatus(null);
        addLog(`Address has code but not EIP-7702 delegation`, 'warning');
        return null;
      }
    } catch (error) {
      addLog(`Error checking delegation: ${error.message}`, 'error');
      return null;
    }
  };

  // Add batch transaction
  const addBatchTransaction = () => {
    setBatchTransactions([
      ...batchTransactions,
      { to: '', value: '0', data: '0x' }
    ]);
  };

  // Update batch transaction
  const updateBatchTransaction = (index, field, value) => {
    const updated = [...batchTransactions];
    updated[index][field] = value;
    setBatchTransactions(updated);
  };

  // Remove batch transaction
  const removeBatchTransaction = (index) => {
    setBatchTransactions(batchTransactions.filter((_, i) => i !== index));
  };

  // Create authorization for EIP-7702
  const createAuthorization = async (nonce) => {
    try {
      addLog(`Creating authorization with nonce: ${nonce}`, 'info');
      
      const chainId = await provider.getNetwork().then(n => n.chainId);
      
      // Create the authorization message
      const authMessage = {
        chainId: chainId,
        address: delegationContract,
        nonce: nonce
      };

      // Sign the authorization using MetaMask's eth_signTypedData_v4
      const domain = {
        name: 'EIP7702',
        version: '1',
        chainId: chainId
      };

      const types = {
        Authorization: [
          { name: 'chainId', type: 'uint256' },
          { name: 'address', type: 'address' },
          { name: 'nonce', type: 'uint256' }
        ]
      };

      // Use MetaMask's signTypedData for authorization
      const signature = await signer.signTypedData(domain, types, authMessage);
      
      // Parse the signature
      const sig = ethers.Signature.from(signature);
      
      const authorization = {
        chainId: chainId,
        address: delegationContract,
        nonce: nonce,
        yParity: sig.yParity,
        r: sig.r,
        s: sig.s
      };

      addLog('Authorization created successfully', 'success');
      return authorization;
    } catch (error) {
      addLog(`Failed to create authorization: ${error.message}`, 'error');
      throw error;
    }
  };

  // Send EIP-7702 transaction
  const sendEIP7702Transaction = async () => {
    if (!signer || !provider) {
      addLog('Please connect wallet first', 'error');
      return;
    }

    if (batchTransactions.length === 0) {
      addLog('Please add at least one transaction', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get current nonce
      const currentNonce = await signer.getNonce();
      addLog(`Current nonce: ${currentNonce}`, 'info');

      // Create authorization with incremented nonce
      const auth = await createAuthorization(currentNonce + 1);

      // Prepare calls array
      const calls = batchTransactions.map(tx => [
        tx.to || ethers.ZeroAddress,
        ethers.parseEther(tx.value || '0'),
        tx.data || '0x'
      ]);

      addLog(`Preparing ${calls.length} batch transactions`, 'info');

      // Create contract instance pointing to the signer's address (not the delegation contract)
      const delegatedContract = new ethers.Contract(
        account,
        contractABI,
        signer
      );

      // Send the EIP-7702 transaction
      const tx = await delegatedContract["execute((address,uint256,bytes)[])"](calls, {
        type: 4, // EIP-7702 transaction type
        authorizationList: [auth]
      });

      addLog(`Transaction sent: ${tx.hash}`, 'success');
      addLog('Waiting for confirmation...', 'info');

      const receipt = await tx.wait();
      addLog(`Transaction confirmed in block ${receipt.blockNumber}`, 'success');

      // Check delegation status after transaction
      await checkDelegationStatus();

      // Update balance
      const newBalance = await provider.getBalance(account);
      setBalance(ethers.formatEther(newBalance));

    } catch (error) {
      addLog(`Transaction failed: ${error.message}`, 'error');
      console.error('Full error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Send sponsored transaction (if already delegated)
  const sendSponsoredTransaction = async () => {
    if (!signer || !provider) {
      addLog('Please connect wallet first', 'error');
      return;
    }

    if (!delegationStatus) {
      addLog('Account must be delegated first', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      // Create contract instance
      const delegatedContract = new ethers.Contract(
        account,
        contractABI,
        signer
      );

      // Get contract nonce
      const contractNonce = await delegatedContract.nonce();
      addLog(`Contract nonce: ${contractNonce}`, 'info');

      // Prepare calls
      const calls = batchTransactions.map(tx => [
        tx.to || ethers.ZeroAddress,
        ethers.parseEther(tx.value || '0'),
        tx.data || '0x'
      ]);

      // Create signature for sponsored transaction
      const signature = await createSignatureForCalls(calls, contractNonce);

      // Send sponsored transaction
      const tx = await delegatedContract["execute((address,uint256,bytes)[],bytes)"](
        calls, 
        signature
      );

      addLog(`Sponsored transaction sent: ${tx.hash}`, 'success');
      const receipt = await tx.wait();
      addLog(`Sponsored transaction confirmed in block ${receipt.blockNumber}`, 'success');

    } catch (error) {
      addLog(`Sponsored transaction failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Create signature for sponsored calls
  const createSignatureForCalls = async (calls, contractNonce) => {
    // Encode the calls for signature
    let encodedCalls = "0x";
    for (const call of calls) {
      const [to, value, data] = call;
      encodedCalls += ethers.solidityPacked(
        ["address", "uint256", "bytes"], 
        [to, value, data]
      ).slice(2);
    }

    // Create the digest
    const digest = ethers.keccak256(
      ethers.solidityPacked(
        ["uint256", "bytes"], 
        [contractNonce, encodedCalls]
      )
    );

    // Sign the digest
    return await signer.signMessage(ethers.getBytes(digest));
  };

  // Revoke delegation
  const revokeDelegation = async () => {
    if (!signer || !provider) {
      addLog('Please connect wallet first', 'error');
      return;
    }

    setIsLoading(true);
    
    try {
      const currentNonce = await signer.getNonce();
      
      // Create revocation authorization (zero address)
      const revokeAuth = await createAuthorization(currentNonce + 1);
      revokeAuth.address = ethers.ZeroAddress; // Set to zero address to revoke

      // Send revocation transaction
      const tx = await signer.sendTransaction({
        type: 4,
        to: account,
        authorizationList: [revokeAuth]
      });

      addLog(`Revocation transaction sent: ${tx.hash}`, 'success');
      const receipt = await tx.wait();
      addLog('Delegation revoked successfully!', 'success');

      // Check delegation status
      await checkDelegationStatus();

    } catch (error) {
      addLog(`Revocation failed: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">EIP-7702 Batch Transaction dApp</h1>
        
        {/* Connection Status */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
          {!isConnected ? (
            <button
              onClick={connectWallet}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Connect MetaMask
            </button>
          ) : (
            <div>
              <p><strong>Account:</strong> {account}</p>
              <p><strong>Balance:</strong> {balance} ETH</p>
              <p><strong>Delegation Status:</strong> {delegationStatus ? `✅ Delegated to ${delegationStatus}` : '❌ Not delegated'}</p>
            </div>
          )}
        </div>

        {/* Delegation Contract */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Delegation Contract</h2>
          <input
            type="text"
            value={delegationContract}
            onChange={(e) => setDelegationContract(e.target.value)}
            placeholder="Delegation contract address"
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          <button
            onClick={() => checkDelegationStatus()}
            disabled={!isConnected}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
          >
            Check Delegation Status
          </button>
        </div>

        {/* Batch Transactions */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Batch Transactions</h2>
          
          {batchTransactions.map((tx, index) => (
            <div key={index} className="border border-gray-200 p-4 rounded mb-4">
              <h3 className="font-medium mb-2">Transaction {index + 1}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={tx.to}
                  onChange={(e) => updateBatchTransaction(index, 'to', e.target.value)}
                  placeholder="To address"
                  className="p-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={tx.value}
                  onChange={(e) => updateBatchTransaction(index, 'value', e.target.value)}
                  placeholder="Value in ETH"
                  className="p-2 border border-gray-300 rounded"
                />
                <input
                  type="text"
                  value={tx.data}
                  onChange={(e) => updateBatchTransaction(index, 'data', e.target.value)}
                  placeholder="Call data (0x)"
                  className="p-2 border border-gray-300 rounded"
                />
              </div>
              <button
                onClick={() => removeBatchTransaction(index)}
                className="bg-red-500 text-white px-2 py-1 rounded text-sm mt-2 hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ))}

          <button
            onClick={addBatchTransaction}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          >
            Add Transaction
          </button>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={sendEIP7702Transaction}
              disabled={!isConnected || isLoading || batchTransactions.length === 0}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
            >
              {isLoading ? 'Processing...' : 'Send EIP-7702 Transaction'}
            </button>
            
            <button
              onClick={sendSponsoredTransaction}
              disabled={!isConnected || isLoading || !delegationStatus || batchTransactions.length === 0}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-gray-300"
            >
              Send Sponsored Transaction
            </button>
            
            <button
              onClick={revokeDelegation}
              disabled={!isConnected || isLoading || !delegationStatus}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-300"
            >
              Revoke Delegation
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Transaction Logs</h2>
            <button
              onClick={clearLogs}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet...</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`p-2 mb-2 rounded text-sm ${
                    log.type === 'error' ? 'bg-red-100 text-red-800' :
                    log.type === 'success' ? 'bg-green-100 text-green-800' :
                    log.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  <span className="font-mono text-xs text-gray-500">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;