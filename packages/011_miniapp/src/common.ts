export const RPC_URL = import.meta.env.VITE_RPC_URL;

import { createPublicClient, createWalletClient, http } from "viem";
import { worldchain } from "viem/chains";

export const getWorldchainClient = () =>
  createPublicClient({
    chain: worldchain,
    transport: http(RPC_URL),
  });

export const getWorldchainWalletClient = () =>
  createWalletClient({
    chain: worldchain,
    transport: http(RPC_URL),
  });
