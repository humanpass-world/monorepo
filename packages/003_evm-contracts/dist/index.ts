// address
import ADDRESS from "./address/fixed.json";

// abi
import HUMANPASS_VERIFIER_ABI from "../out/HumanPassVerifier.sol/HumanPassVerifier.json";

export const getContractAddress = (contract: "verifier"): `0x${string}` => {
  return ADDRESS[contract] as `0x${string}`;
};

export const getFunctionABI = (contract: "verifier", functionName: string) => {
  const abi = HUMANPASS_VERIFIER_ABI.abi;

  return abi.find(
    (item: any) => item.type === "function" && item.name === functionName
  )!;
};

export const getEventABI = (contract: "verifier", eventName: string) => {
  const abi = HUMANPASS_VERIFIER_ABI.abi;

  return abi.find(
    (item: any) => item.type === "event" && item.name === eventName
  )!;
};
