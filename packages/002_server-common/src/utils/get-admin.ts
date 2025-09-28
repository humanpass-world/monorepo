import { privateKeyToAccount } from "viem/accounts";

export const getAdmin = (privateKey: `0x${string}`) => ({
  account: privateKeyToAccount(privateKey),
  address: privateKeyToAccount(privateKey).address,
});
