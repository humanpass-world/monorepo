import { useState } from "react";
import { useSearchParams } from "react-router";
import AnimatedBackgrounds from "../../../../components/animatedBackgrounds/animated-backgrounds";
import AnnouncementPill from "../../../../components/announcementPill/announcement-pill";
import Heading from "../../../../components/heading/heading";
import Subheading from "../../../../components/subheading/subheading";
import VerifyButton from "../../../../components/verifyButton/verify-button";
export default function VerifySocialOAuthResult() {
  const [error, setError] = useState("");
  const [searchParams] = useSearchParams();
  const username = searchParams.get("username");
  const id = searchParams.get("id");
  const signal = searchParams.get("signal");

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
              title="VERIFICATION COMPLETED"
              color={error ? "#DB2C2C" : "#00E6C5"}
            />
          </div>
          <Heading
            text={
              error
                ? "Something went wrong"
                : "Please go back to HumanPass to continue"
            }
            style={{ width: "100%" }}
          />
          {error && (
            <Subheading
              text={`Error message: ${error}`}
              style={{ width: "100%" }}
            />
          )}
        </div>
        <div style={{ gap: 10, flexDirection: "column", display: "flex" }}>
          <a
            href={`https://world.org/mini-app?app_id=${
              import.meta.env.VITE_WORLD_APP_ID
            }&path=${encodeURIComponent(
              `/verify-social?username=${username}&id=${id}&signal=${signal}`
            )}`}
          >
            <VerifyButton
              label=""
              style={{ width: "100%" }}
              success="Verification complete!"
              error="Verification failed"
              variant={error ? "Error" : "Success"}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
