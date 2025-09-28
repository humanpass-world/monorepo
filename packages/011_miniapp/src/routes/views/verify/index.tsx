import {
  useGetMiniappVerifyWalletGetRequest,
  usePostMiniappVerifyWalletProof,
} from "@/lib/generated/react-query";
import { useWorldAuthStore } from "@hp/client-common";
import { ISuccessResult, VerificationLevel } from "@worldcoin/idkit-core";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import AnimatedBackgrounds from "../../../../components/animatedBackgrounds/animated-backgrounds";
import AnnouncementPill from "../../../../components/announcementPill/announcement-pill";
import BackButton from "../../../../components/backButton/link-button";
import Button from "../../../../components/button/button";
import Heading from "../../../../components/heading/heading";
import Subheading from "../../../../components/subheading/subheading";
import VerifyButton from "../../../../components/verifyButton/verify-button";
export default function VerifySocial() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showComplete, setShowComplete] = useState(false);

  const [searchParams] = useSearchParams();
  const requestId = searchParams.get("requestId")!;

  const {
    data: dataGetMiniappVerifyWalletGetRequest,
    isLoading: isLoadingGetMiniappVerifyWalletGetRequest,
  } = useGetMiniappVerifyWalletGetRequest(
    {
      requestId: requestId,
    },
    {
      query: {
        enabled: !!requestId,
      },
    }
  );

  const { mutateAsync: postMiniappVerifyWalletProof } =
    usePostMiniappVerifyWalletProof();

  const { verify } = useWorldAuthStore();
  // verify
  const handleSubmit = async () => {
    setIsLoading(true);

    const res = await verify({
      action: "verify-ownership",
      signal: dataGetMiniappVerifyWalletGetRequest?.signal,
      verificationLevel: VerificationLevel.Device,
    });

    if (!res.success) {
      setError(res.error ?? "Unknown error");
    } else {
      const resData = res.data as ISuccessResult;
      // 서버로 보내기
      await postMiniappVerifyWalletProof({
        data: {
          id: requestId,
          merkle_root: resData.merkle_root,
          nullifier_hash: resData.nullifier_hash,
          proof: resData.proof,
          verification_level: resData.verification_level,
        },
      });

      setShowComplete(true);
      // setTimeout(() => {
      //   navigate("/");
      // }, 1000);
    }

    setIsLoading(false);
  };

  if (isLoadingGetMiniappVerifyWalletGetRequest) {
    return <div>Loading...</div>;
  }

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
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              justifyContent: "start",
            }}
          >
            <img
              src={"/app-icons/stargate.png"}
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
            <AnnouncementPill
              title={
                error
                  ? "VERIFICATION FAILED"
                  : showComplete
                  ? "VERIFICATION COMPLETED"
                  : "VERIFICATION REQUEST"
              }
              color={error ? "#DB2C2C" : showComplete ? "#00E6C5" : "white"}
              variant="No Icon"
            />
          </div>
          <Heading
            text={
              error
                ? "Your verification wasn't successful"
                : showComplete
                ? `Please go back to the verification page to continue`
                : isLoading
                ? "Verifying..."
                : `Verify that you're a human who owns this wallet.`
            }
            style={{ width: "100%" }}
          />
          <Subheading
            text={
              error
                ? `Error message: ${error}`
                : `Wallet address: ${dataGetMiniappVerifyWalletGetRequest?.address}`
            }
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ gap: 10, flexDirection: "column", display: "flex" }}>
          <VerifyButton
            label="Verify"
            style={{ width: "100%" }}
            onClick={handleSubmit}
            success="Verification complete!"
            error="Verification failed"
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
            label={isLoading ? "Please wait" : "Close"}
            style={{ width: "100%", height: 52, opacity: isLoading ? 0.5 : 1 }}
            onClick={() => {
              if (isLoading) return;
              navigate("/");
            }}
          />
        </div>
      </div>
    </div>
  );
}
