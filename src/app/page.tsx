"use client";
import { Contract } from "web3-eth-contract";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Web3 from "web3";

import { Button, Input, useToast } from "@/components";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/config";
import { formatBalance } from "@/lib/utils";

const initialState = { accounts: [], balance: "" };

export default function Home() {
  const [wallet, setWallet] = useState(initialState);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [signatureDisp, setSignatureDisp] = useState("");
  const [contractDisp, setContractDisp] = useState("");
  const [contractVal, setContractVal] = useState("");
  const [signature, setSignature] = useState("");
  const [message, setMessage] = useState("");
  const [address, setAddress] = useState("");
  const [web3, setWeb3] = useState<Web3>();
  const [contract, setContract] = useState<Contract>();
  const disableConnect = Boolean(wallet) && isConnecting;
  const { toast } = useToast();

  useEffect(() => {
    getProvider();
    return () => {
      window.ethereum?.removeListener("accountsChanged", refreshAccounts);
    };
  }, []);

  const getProvider = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      const contract = new web3!.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
      setWeb3(web3);
      setContract(contract);
      refreshAccounts(accounts);
      window.ethereum.on("accountsChanged", refreshAccounts);
    }
  };

  const refreshAccounts = (accounts: any) => {
    if (accounts.length > 0) {
      setAddress(accounts[0]);
      updateWallet(accounts);
    } else {
      setWallet(initialState);
    }
  };

  const updateWallet = async (accounts: any) => {
    const balance = formatBalance(
      await window.ethereum.request({
        method: "eth_getBalance",
        params: [accounts[0], "latest"],
      })
    );
    setWallet({ accounts, balance });
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    await window.ethereum
      .request({
        method: "eth_requestAccounts",
      })
      .then((accounts: []) => {
        updateWallet(accounts);
      })
      .catch((err: any) => {
        toast({
          variant: "destructive",
          title: "Failed",
          description: err.message,
        });
      });
    setIsConnecting(false);
  };

  const handleSign = async () => {
    setIsLoading(true);
    const messageHex = web3!.utils.utf8ToHex(message);
    const messageHash = web3!.utils.sha3(messageHex);
    web3!.eth.personal
      .sign(messageHash!, address, "test")
      .then((response) => {
        setSignatureDisp(response);
        setMessage("");
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Failed",
          description: error.message,
        });
      })
      .finally(() => setIsLoading(false));
  };

  const handleVerify = async () => {
    setIsLoading(true);
    const messageHex = web3!.utils.utf8ToHex(message);
    const messageHash = web3!.utils.sha3(messageHex);
    const signer = web3!.eth.accounts.recover(messageHash!, signature);
    if (signer === address) {
      toast({
        title: "Success",
        description: "Your signature is valid!",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Unfortunately, your signature is invalid!",
      });
    }
    setIsLoading(false);
  };

  const handleStoreValue = async () => {
    setIsLoading(true);
    contract!.methods
      .store(contractVal)
      .send({ from: address })
      .then(() => {
        toast({
          title: "Success",
          description: "Your transaction is success",
        });
        setContractVal("");
      })
      .catch((err: any) => {
        toast({
          variant: "destructive",
          title: "Failed",
          description: err.message,
        });
      })
      .finally(() => setIsLoading(false));
  };

  const handleCallValue = async () => {
    setIsLoading(true);
    contract!.methods
      .retrieve()
      .call()
      .then((result: any) => {
        toast({
          title: "Success",
          description: "Success getting the last value",
        });
        setContractDisp(result);
      })
      .catch((err: any) => {
        toast({
          variant: "destructive",
          title: "Failed",
          description: err.message,
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <div className="container h-full flex flex-col items-center justify-center">
      {wallet.accounts.length < 1 && (
        <Button disabled={disableConnect} onClick={handleConnect}>
          Connect MetaMask
        </Button>
      )}
      {wallet.accounts.length > 0 && (
        <div className="border-2 border-dashed flex flex-col justify-center items-center w-full md:w-3/4 lg:w-1/2 p-10 rounded-2xl">
          <p>Your Wallet Accounts: {wallet.accounts[0]}</p>
          <p>Your Wallet Balance: {wallet.balance}</p>
          <div className="flex flex-col gap-3 w-full p-3">
            <Input
              placeholder="Enter a message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className="break-words">
              Signature: <small>{signatureDisp}</small>
            </p>
            {signatureDisp === "" ? (
              <Button disabled={isLoading} type="button" onClick={handleSign}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign
              </Button>
            ) : (
              <>
                <Input
                  placeholder="Enter a signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
                <Button
                  disabled={isLoading}
                  type="button"
                  onClick={handleVerify}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Verify
                </Button>
              </>
            )}

            <div className="border w-full my-7" />

            <Input
              placeholder="Enter a value"
              value={contractVal}
              onChange={(e) => setContractVal(e.target.value)}
              type="number"
            />
            <Button
              disabled={isLoading}
              type="button"
              onClick={handleStoreValue}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Set the Value
            </Button>
            <Button
              disabled={isLoading}
              type="button"
              onClick={handleCallValue}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Get the Value
            </Button>
            <p>Your last value: {contractDisp}</p>
          </div>
        </div>
      )}
    </div>
  );
}
