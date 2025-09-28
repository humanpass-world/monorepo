import { getMiniappVerifyWalletGetRequest } from "@/lib/generated/react-query";
import { tryCatch } from "@hp/client-common";
import { useEffect, useState } from "react";
import { PinInput } from "react-input-pin-code";
import { useNavigate } from "react-router";
import AnimatedBackgrounds from "../../../../components/animatedBackgrounds/animated-backgrounds";
import AnnouncementPill from "../../../../components/announcementPill/announcement-pill";
import BackButton from "../../../../components/backButton/link-button";
import Button from "../../../../components/button/button";
import Heading from "../../../../components/heading/heading";
import Subheading from "../../../../components/subheading/subheading";
import VerifyButton from "../../../../components/verifyButton/verify-button";

export default function VerifyPinCode() {
  const navigate = useNavigate();

  const [values, setValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = async () => {
    if (values.concat("").join("").length !== 6) {
      setError(true);
      return;
    }
    setIsLoading(true);
    const response = await tryCatch(
      getMiniappVerifyWalletGetRequest({
        code: values.concat("").join(""),
      })
    );
    if (response.error) {
      console.log(response.error);
      setError(true);
      return;
    }

    navigate(`/verify?requestId=${response.data.requestId}`);
    setIsLoading(false);
  };

  useEffect(() => {
    setError(false);
  }, [values]);

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
          <AnnouncementPill color="white" title="VERIFICATION REQUEST" />
          <Heading
            text="Enter the 6-digit code on the screen"
            style={{ width: "100%" }}
          />
          <Subheading text="6-digit code" style={{ width: "100%" }} />
          <PinInput
            values={values}
            onChange={(value, index, values) => setValues(values)}
            inputStyle={{ color: "white" }}
            borderColor="rgba(255,255,255,0.5)"
            focusBorderColor="rgb(255,255,255)"
            validBorderColor="#00E6C5"
            size="lg"
            onComplete={() => handleSubmit()}
          />
        </div>
        <div style={{ gap: 10, flexDirection: "column", display: "flex" }}>
          <VerifyButton
            label="Submit"
            style={{ width: "100%" }}
            onClick={handleSubmit}
            variant={error ? "Error" : isLoading ? "Loading" : "Default"}
          />
          <Button
            label="Scan QR instead"
            style={{ width: "100%", height: 52 }}
            onClick={() => navigate("/coming-soon")}
          />
        </div>
      </div>
    </div>
  );
}
