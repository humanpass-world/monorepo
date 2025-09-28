import { usePostMiniappVerifySocialXProof } from "@/lib/generated/react-query";
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
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username")!;
  const signal = searchParams.get("signal")!;
  const id = searchParams.get("id")!;
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showComplete, setShowComplete] = useState(false);

  const { verify } = useWorldAuthStore();

  const { mutateAsync: postMiniappVerifySocialXProof } =
    usePostMiniappVerifySocialXProof();

  const handleSubmit = async () => {
    setIsLoading(true);
    const res = await verify({
      action: "verify-ownership",
      signal: signal,
      verificationLevel: VerificationLevel.Device,
    });

    if (!res.success) {
      setError(res.error ?? "Unknown error");
    } else {
      const resData = res.data as ISuccessResult;
      // 서버로 보내기
      await postMiniappVerifySocialXProof({
        data: {
          id: id,
          merkle_root: resData.merkle_root,
          nullifier_hash: resData.nullifier_hash,
          proof: resData.proof,
          verification_level: resData.verification_level,
        },
      });

      setShowComplete(true);
      setTimeout(() => {
        navigate("/");
      }, 1000);
    }
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
          <BackButton
            onClick={() => {
              navigate("/");
            }}
          />
          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
              justifyContent: "start",
            }}
          >
            <img
              src={"/app-icons/x.jpg"}
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
                  ? "CLAIM FAILED"
                  : showComplete
                  ? "CLAIM COMPLETED"
                  : "CLAIM OWNERSHIP"
              }
              color={error ? "#DB2C2C" : showComplete ? "#00E6C5" : "white"}
              variant="No Icon"
            />
          </div>
          <Heading
            text={
              error
                ? "Something went wrong"
                : showComplete
                ? `You're all set! @${username}`
                : "Claim ownership of your X/Twitter account"
            }
            style={{ width: "100%" }}
          />
          <Subheading
            text={error ? `Error message: ${error}` : `Account: @${username}`}
            style={{ width: "100%" }}
          />
        </div>
        <div style={{ gap: 10, flexDirection: "column", display: "flex" }}>
          <VerifyButton
            label="Claim"
            style={{ width: "100%" }}
            onClick={handleSubmit}
            success="Claim complete!"
            error="Claim failed"
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
              navigate(-1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
