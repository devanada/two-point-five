"use client";
import { useEffect, useState } from "react";
import Web3 from "web3";

import { Button, Input, useToast } from "@/components";
import { formatBalance } from "@/lib/utils";

const initialState = { accounts: [], balance: "" };

export default function Home() {
  const [wallet, setWallet] = useState(initialState);
  const [isConnecting, setIsConnecting] = useState(false);
  const [signature, setSignature] = useState("");
  const [signatureDisp, setSignatureDisp] = useState("");
  const [address, setAddress] = useState("");
  const [message, setMessage] = useState("");
  const [web3, setWeb3] = useState<Web3>();
  const disableConnect = Boolean(wallet) && isConnecting;
  const { toast } = useToast();

  useEffect(() => {
    getProvider();
  }, []);

  const getProvider = async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      const accounts = await web3.eth.getAccounts();
      setAddress(accounts[0]);
      setWeb3(web3);
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
          title: "Error",
          description: err.message,
        });
      });
    setIsConnecting(false);
  };

  const handleSign = async () => {
    const messageHex = web3!.utils.utf8ToHex(message);
    const messageHash = web3!.utils.sha3(messageHex);
    const signature = await web3!.eth.personal.sign(
      messageHash!,
      address,
      "test"
    );
    setSignatureDisp(signature);
    setMessage("");
  };

  const verifySign = async () => {
    const messageHex = web3!.utils.utf8ToHex(message);
    const messageHash = web3!.utils.sha3(messageHex);
    const signer = web3!.eth.accounts.recover(messageHash!, signature);
    if (signer === address) {
      toast({
        title: "Success",
        description: "Your signature is valid!",
        duration: 5000,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Failed",
        description: "Unfortunately, your signature is invalid!",
        duration: 5000,
      });
    }
  };

  return (
    <div className="container h-full flex flex-col items-center justify-center">
      {wallet.accounts.length < 1 && (
        <Button disabled={disableConnect} onClick={handleConnect}>
          Connect MetaMask
        </Button>
      )}
      {wallet.accounts.length > 0 && (
        <div className="border-4 border-dashed flex flex-col justify-center items-center w-full md:w-1/2 p-10 rounded-2xl">
          <p>Your Wallet Accounts: {wallet.accounts[0]}</p>
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
              <Button type="button" onClick={handleSign}>
                Sign
              </Button>
            ) : (
              <>
                <Input
                  placeholder="Enter a signature"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
                <Button type="button" onClick={verifySign}>
                  Verify
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
