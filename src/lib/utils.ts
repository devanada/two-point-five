import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBalance(rawBalance: string) {
  const balance = (parseInt(rawBalance) / 1000000000000000000).toFixed(2);
  return balance;
}

export function formatChainAsNum(chainIdHex: string) {
  const chainIdNum = parseInt(chainIdHex);
  return chainIdNum;
}
