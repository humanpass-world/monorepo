import React, { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { useAccount } from "wagmi";
import "./styles.css";

interface HumanPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

type Step = 1 | 2 | 3 | 4;

const HumanPassModal: React.FC<HumanPassModalProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const { address } = useAccount();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [username, setUsername] = useState("");
  const [requestId, setRequestId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setUsername("");
      setVerificationCode("");
      setIsLoading(false);
      setShowConfetti(false);
    }
  }, [isOpen]);

  const handleVerifyHuman = async () => {
    if (!username.trim()) return;

    setIsLoading(true);
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/miniapp/verify/wallet/request`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: address,
          worldUsername: username,
          chainId: "480", // world 로 고정
        }),
      }
    );

    if (!res.ok) {
      const data = await res.json<{ code: string; error: string }>();
      if (data.code === "WORLD_USERNAME_NOT_FOUND") {
        // user need to create world app account
        window.location.href = `https://world.org/mini-app?app_id=${
          import.meta.env.VITE_WORLD_APP_ID
        }`;
      } else if (data.code === "USER_NOT_REGISTERED") {
        // user need to register in our miniapp
        window.location.href = `https://world.org/mini-app?app_id=${
          import.meta.env.VITE_WORLD_APP_ID
        }`;
      }
      setIsLoading(false);
      return;
    }

    const data = await res.json<{ requestId: string; code: string }>();
    console.log(data);
    setRequestId(data.requestId);
    setVerificationCode(data.code);
    setCurrentStep(2);
    handleWorldAppVerification(false, data.requestId);
  };

  const handleWorldAppVerification = async (
    userClick: boolean,
    requestId: string
  ) => {
    setIsLoading(true);

    const res = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }/miniapp/verify/wallet/polling?requestId=${requestId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      return;
    }

    const data = await res.json<{
      done: boolean;
      serverPayload: {
        account: string;
        nullifier_hash: string;
        merkle_root: string;
        proof_hash_keccak256: string;
        proof_hash_sha256: string;
        verification_level: number;
        action_hash: string;
        signal_hash: string;
        server_deadline: string;
        server_nonce: string;
        server_sig: string;
      };
      chainId: string;
    }>();

    if (data.done) {
      setIsLoading(false);
      setCurrentStep(3);
    } else {
      if (!userClick) {
        setTimeout(() => {
          handleWorldAppVerification(false, requestId);
        }, 2000);
      } else {
        alert("Please complete verification in your World App");
      }
    }
  };

  const handleSignature = () => {
    setIsLoading(true);

    // Simulate signature process
    setTimeout(() => {
      setIsLoading(false);
      setCurrentStep(4);
      setShowConfetti(true);

      // Hide confetti after 5 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }, 2000);
  };

  const handleClose = () => {
    setCurrentStep(1);
    setUsername("");
    setVerificationCode("");
    setIsLoading(false);
    setShowConfetti(false);
    onClose();
  };

  const handleComplete = () => {
    setCurrentStep(1);
    setUsername("");
    setVerificationCode("");
    setIsLoading(false);
    setShowConfetti(false);
    onComplete?.();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="humanpass-modal-overlay">
      {showConfetti && <Confetti />}
      <div className="humanpass-modal">
        <div className="humanpass-modal-header">
          <h2>HumanPass Verification</h2>
          <button className="close-button" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="humanpass-modal-content">
          {/* Step 1: Username Input */}
          {currentStep === 1 && (
            <div className="step-container">
              <div className="step-indicator">
                <span className="step-number">1</span>
                <span className="step-text">Enter World App Username</span>
              </div>

              <div className="input-group">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="@iamhuman.1204"
                  className="username-input"
                />
              </div>

              <button
                className="verify-button"
                onClick={handleVerifyHuman}
                disabled={!username.trim() || isLoading}
              >
                {isLoading ? "Loading..." : "Get Verification Notification"}
              </button>
            </div>
          )}

          {/* Step 2: Verification Code */}
          {currentStep === 2 && (
            <div className="step-container">
              <div className="step-indicator">
                <span className="step-number">2</span>
                <span className="step-text">World App Verification</span>
              </div>

              <div className="verification-code-container">
                <h3>Verification Code</h3>
                <div className="verification-code">
                  {verificationCode.split("").map((digit, index) => (
                    <span key={index} className="code-digit">
                      {digit}
                    </span>
                  ))}
                </div>

                <p className="verification-message">
                  Please complete verification in your World App
                </p>

                {isLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Waiting for verification...</p>
                  </div>
                ) : (
                  <button
                    className="verify-button"
                    // onClick={handleWorldAppVerification}
                  >
                    I've completed verification in World App
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Signature Request */}
          {currentStep === 3 && (
            <div className="step-container">
              <div className="step-indicator">
                <span className="step-number">3</span>
                <span className="step-text">Digital Signature</span>
              </div>

              <div className="signature-container">
                <h3>Complete Digital Signature</h3>
                <p className="signature-message">
                  Please sign the transaction to complete your HumanPass
                  verification
                </p>

                {isLoading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Processing signature...</p>
                  </div>
                ) : (
                  <button className="verify-button" onClick={handleSignature}>
                    Sign Transaction
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && (
            <div className="step-container">
              <div className="step-indicator">
                <span className="step-number">4</span>
                <span className="step-text">Verification Complete</span>
              </div>

              <div className="success-container">
                <div className="success-icon">🎉</div>
                <h3>Congratulations!</h3>
                <p className="success-message">
                  Your wallet has been successfully verified as human through
                  HumanPass!
                </p>
                <p className="username-display">
                  Verified as: <strong>{username}</strong>
                </p>

                <button
                  className="verify-button success-button"
                  onClick={handleComplete}
                >
                  Complete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default HumanPassModal;
