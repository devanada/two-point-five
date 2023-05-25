"use client";
import detectEthereumProvider from "@metamask/detect-provider";
import { useEffect, useState } from "react";

import { Button } from "@/components/button";
import { formatBalance, formatChainAsNum } from "@/lib/utils";

const initialState = { accounts: [], balance: "", chainId: "" };

export default function Home() {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(false);
  const [wallet, setWallet] = useState(initialState);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    getProvider();
    return () => {
      window.ethereum?.removeListener("accountsChanged", refreshAccounts);
      window.ethereum?.removeListener("chainChanged", refreshChain);
    };
  }, []);

  const getProvider = async () => {
    const provider = await detectEthereumProvider({ silent: true });
    setHasProvider(Boolean(provider));
    if (provider) {
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      refreshAccounts(accounts);
      window.ethereum.on("accountsChanged", refreshAccounts);
      window.ethereum.on("chainChanged", refreshChain);
    }
  };

  const refreshAccounts = (accounts: any) => {
    if (accounts.length > 0) {
      updateWallet(accounts);
    } else {
      setWallet(initialState);
    }
  };

  const refreshChain = (chainId: any) => {
    setWallet((wallet) => ({ ...wallet, chainId }));
  };

  const updateWallet = async (accounts: any) => {
    const balance = formatBalance(
      await window.ethereum!.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })
    );
    const chainId = await window.ethereum!.request({
      method: "eth_chainId",
    });
    setWallet({ accounts, balance, chainId });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    await window.ethereum
      .request({
        method: "eth_requestAccounts",
      })
      .then((accounts: []) => {
        setError(false);
        updateWallet(accounts);
      })
      .catch((err: any) => {
        setError(true);
        setErrorMessage(err.message);
      });
    setIsConnecting(false);
  };

  return (
    <div className="container h-full flex flex-col place-items-center">
      <h2>Injected Provider {hasProvider ? "DOES" : "DOES NOT"} Exist</h2>
      {window.ethereum?.isMetaMask && wallet.accounts.length < 1 && (
        <Button onClick={handleConnect}>Connect MetaMask</Button>
      )}
      {wallet.accounts.length > 0 && (
        <>
          <div>Wallet Accounts: {wallet.accounts[0]}</div>
          <div>Wallet Balance: {wallet.balance}</div>
          <div>Hex ChainId: {wallet.chainId}</div>
          <div>Numeric ChainId: {formatChainAsNum(wallet.chainId)}</div>
        </>
      )}
      {error && (
        <div onClick={() => setError(false)}>
          <strong>Error:</strong> {errorMessage}
        </div>
      )}
    </div>
  );
}
