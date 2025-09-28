import { getWorldchainClient } from "@/common";
import { tryCatch } from "@hp/client-common";
import { useWaitForTransactionReceipt } from "@worldcoin/minikit-react";
import { useEffect, useState } from "react";

export function useTransaction<T>(transaction: (params: T) => Promise<string>) {
  const [transactionId, setTransactionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingResolve, setPendingResolve] = useState<
    ((value: string) => void) | null
  >(null);
  const [pendingReject, setPendingReject] = useState<
    ((reason?: Error) => void) | null
  >(null);

  const transactionReceipt = useWaitForTransactionReceipt({
    client: getWorldchainClient(),
    appConfig: {
      app_id: import.meta.env.VITE_WORLDCOIN_APP_ID,
    },
    transactionId: transactionId,
  });

  useEffect(() => {
    console.log(
      transactionReceipt.isSuccess,
      pendingResolve,
      transactionReceipt.transactionHash
    );
    if (
      transactionReceipt.isSuccess &&
      pendingResolve &&
      transactionReceipt.transactionHash
    ) {
      setIsLoading(false);
      pendingResolve(transactionReceipt.transactionHash);
      setPendingResolve(null);
      setPendingReject(null);
    }
  }, [
    transactionReceipt.isSuccess,
    transactionReceipt.transactionHash,
    pendingResolve,
  ]);

  useEffect(() => {
    if (transactionReceipt.isError && pendingReject) {
      setIsLoading(false);
      pendingReject(new Error("Transaction failed"));
      setPendingResolve(null);
      setPendingReject(null);
    }
  }, [transactionReceipt.isError, pendingReject]);

  return {
    run: async (params: T): Promise<string> => {
      setTransactionId("");
      setIsLoading(true);
      const { data, error } = await tryCatch(transaction(params));

      if (error) {
        setIsLoading(false);
        throw error;
      }

      setTransactionId(data);

      // Return a promise that resolves when the transaction is confirmed
      return new Promise<string>((resolve, reject) => {
        setPendingResolve(() => resolve);
        setPendingReject(() => reject);
      });
    },
    isConfirming: isLoading,
  };
}
