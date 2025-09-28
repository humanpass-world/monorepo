import {
  getGetMiniappVerifiedWalletListQueryKey,
  useDeleteMiniappVerifiedWalletDisconnect,
  useGetMiniappVerifiedWalletGetRequest,
} from "@/lib/generated/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import AnimatedBackgrounds from "../../../../components/animatedBackgrounds/animated-backgrounds";
import BackButton from "../../../../components/backButton/link-button";
import Button from "../../../../components/button/button";
import Heading from "../../../../components/heading/heading";
import Subheading from "../../../../components/subheading/subheading";
import VerifyButton from "../../../../components/verifyButton/verify-button";
export default function Disconnect() {
  const [searchParams] = useSearchParams();
  const id = searchParams.get("id")!;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showComplete, setShowComplete] = useState(false);

  const { data: dataGetMiniappVerifiedWalletGetRequest } =
    useGetMiniappVerifiedWalletGetRequest(id);

  const queryClient = useQueryClient();
  const { mutateAsync } = useDeleteMiniappVerifiedWalletDisconnect({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetMiniappVerifiedWalletListQueryKey(),
        });
      },
    },
  });

  const handleSubmit = async () => {
    setIsLoading(true);
    await mutateAsync({
      data: {
        requestId: id,
      },
    });
    setIsLoading(false);
    setShowComplete(true);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      <AnimatedBackgrounds
        style={{ height: "100%", position: "absolute", zIndex: -1 }}
        variant="Pulser"
      />
      <div
        style={{
          padding: 20,
          paddingBottom: 32,
          display: "flex",
          justifyContent: "space-between",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
          <BackButton onClick={() => navigate(-1)} />
          <img
            src={"/app-icons/gnosis-safe.png"}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
              borderColor: "rgba(255,255,255,0.1)",
              borderWidth: 1,
              borderStyle: "solid",
            }}
          />
          <Heading
            text={
              error
                ? "Disconnect failed"
                : showComplete
                ? "Disconnected"
                : `Disconnect with ${dataGetMiniappVerifiedWalletGetRequest?.address?.slice(
                    0,
                    6
                  )}...${dataGetMiniappVerifiedWalletGetRequest?.address?.slice(
                    -4
                  )}`
            }
            style={{ width: "100%" }}
          />
          <Subheading
            text={
              error
                ? `Error message: ${error}`
                : `Wallet address: ${dataGetMiniappVerifiedWalletGetRequest?.address}`
            }
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ gap: 10, flexDirection: "column", display: "flex" }}>
          <VerifyButton
            label="Disconnect"
            style={{ width: "100%" }}
            onClick={handleSubmit}
            success="Disconnect complete!"
            error="Something went wrong"
            variant={
              error
                ? "Error"
                : showComplete
                ? "Success"
                : isLoading
                ? "Loading"
                : "Default"
            }
          />
          <Button
            label="Close"
            style={{ width: "100%", height: 52 }}
            onClick={() => navigate(-1)}
          />
        </div>
      </div>
    </div>
  );
}
