import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Loader2,
  Shield,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";
import HumanPassModal from "./components/humanpass";

export default function App() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [isVerifiedHumanLoading, setIsVerifiedHumanLoading] = useState(false);

  const [isVerifiedHuman, setIsVerifiedHuman] = useState(false);
  const [hasAlreadyMinted, setHasAlreadyMinted] = useState(false);
  const [isHumanPassModalOpen, setIsHumanPassModalOpen] = useState(false);

  useEffect(() => {
    if (address) {
      checkHumanVerificationStatus(address);
    } else {
      resetState();
    }
  }, [address]);

  const resetState = () => {
    setMintSuccess(false);
    setIsVerifiedHuman(false);
  };

  const checkHumanVerificationStatus = async (walletAddress: string) => {
    setIsVerifiedHumanLoading(true);
    const res = await fetch(
      `${
        import.meta.env.VITE_API_URL
      }/public/wallet/check?address=${walletAddress}`
    );

    if (!res.ok) {
      alert("Failed to check human verification status");
      return;
    }

    const data = await res.json<
      | {
          verified: true;
          verifiedAt: string;
        }
      | {
          verified: false;
        }
    >();

    setIsVerifiedHuman(data.verified);
    setIsVerifiedHumanLoading(false);
  };

  const disconnectWallet = () => {
    disconnect();
    resetState();
  };

  const handleMint = async () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!isVerifiedHuman) {
      setIsHumanPassModalOpen(true);

      return;
    }

    // -- 여기까지 됨
    if (hasAlreadyMinted) {
      alert(
        "You have already minted your NFT. Only one NFT per verified human is allowed."
      );
      return;
    }

    setIsMinting(true);
    try {
      // NFT minting simulation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setMintSuccess(true);
      setHasAlreadyMinted(true);
    } catch (error) {
      console.error("Minting failed:", error);
      alert("Minting failed");
    } finally {
      setIsMinting(false);
    }
  };

  const canMint =
    isConnected && isVerifiedHuman && !hasAlreadyMinted && !mintSuccess;

  const handleVerificationCheck = () => {
    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    setIsHumanPassModalOpen(true);
  };

  const handleHumanPassComplete = () => {
    setIsVerifiedHuman(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Humanpass NFT</h1>
            </div>
            <Badge variant="secondary" className="gap-1">
              <Shield className="h-3 w-3" />
              Proof of Humanity
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Hero Card */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">
              Human-Verified NFT Collection
            </CardTitle>
            <CardDescription className="text-base">
              Each verified human can mint exactly one NFT. No bots, no
              duplicates, just authentic participation in our exclusive
              community.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4 flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">
                  Human Verification Required
                </p>
                <p className="text-muted-foreground text-xs">
                  One mint per verified identity
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              {isConnected ? "Wallet Connected" : "Connect Wallet"}
            </CardTitle>
            <CardDescription>
              {isConnected
                ? "Your wallet is connected and ready for minting"
                : "Connect your wallet to get started"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <ConnectButton.Custom>
                {({ openConnectModal, authenticationStatus, mounted }) => {
                  const ready = mounted && authenticationStatus !== "loading";

                  return (
                    <Button
                      onClick={openConnectModal}
                      className="w-full"
                      size="lg"
                      disabled={!ready}
                    >
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet
                    </Button>
                  );
                }}
              </ConnectButton.Custom>
            ) : (
              <div className="space-y-4">
                {/* Wallet Info */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                      <Wallet className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {address?.slice(0, 6) + "..." + address?.slice(-4)}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Wallet Connected
                      </p>
                    </div>
                  </div>
                </div>

                {isVerifiedHumanLoading ? (
                  <div className="p-4 rounded-lg border bg-muted/50 border-muted-foreground/25 dark:bg-muted/50 dark:border-muted-foreground/25">
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                    <p className="text-muted-foreground text-sm">
                      Checking verification status...
                    </p>
                  </div>
                ) : (
                  <div
                    className={`p-4 rounded-lg border ${
                      isVerifiedHuman
                        ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                        : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isVerifiedHuman ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4
                          className={`font-medium ${
                            isVerifiedHuman
                              ? "text-green-900 dark:text-green-100"
                              : "text-red-900 dark:text-red-100"
                          }`}
                        >
                          {isVerifiedHuman
                            ? "Human Verification Complete"
                            : "Human Verification Required"}
                        </h4>
                        <p
                          className={`text-sm mt-1 ${
                            isVerifiedHuman
                              ? "text-green-700 dark:text-green-300"
                              : "text-red-700 dark:text-red-300"
                          }`}
                        >
                          {isVerifiedHuman
                            ? "Your identity has been verified. You are eligible to mint your exclusive NFT."
                            : "Complete human verification to ensure authenticity and gain minting eligibility."}
                        </p>
                        {!isVerifiedHuman && (
                          <Button
                            onClick={handleVerificationCheck}
                            className="mt-3"
                            size="sm"
                          >
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Start Verification
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Already Minted Warning */}
                {/* {isVerifiedHuman && hasAlreadyMinted && (
                  <div className="p-4 rounded-lg border bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-amber-900 dark:text-amber-100">
                          NFT Already Minted
                        </h4>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          You have already claimed your exclusive NFT. Each
                          verified human can only mint once to ensure fairness.
                        </p>
                      </div>
                    </div>
                  </div>
                )} */}

                {/* NFT Preview/Success */}
                {mintSuccess ? (
                  <div className="p-6 rounded-lg border bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 text-center">
                    <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                      Minting Successful!
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Your exclusive Sample NFT has been successfully minted and
                      added to your wallet.
                    </p>
                  </div>
                ) : (
                  <div className="p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 text-center">
                    <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🎨</span>
                    </div>
                    <h3 className="font-semibold mb-2">Sample NFT</h3>
                    <p className="text-sm text-muted-foreground">
                      Exclusive collection limited to verified humans only
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleMint}
                    disabled={!canMint || isMinting}
                    className="flex-1"
                    size="lg"
                  >
                    {isMinting
                      ? "Minting..."
                      : mintSuccess
                      ? "Successfully Minted"
                      : !isVerifiedHuman
                      ? "Verification Required"
                      : hasAlreadyMinted
                      ? "Already Minted"
                      : "Mint NFT"}
                  </Button>
                  <Button variant="outline" onClick={disconnectWallet}>
                    Disconnect
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-muted-foreground text-sm">
            © 2024 Humanpass NFT - Ensuring authentic human participation in
            Web3
          </p>
        </div>
      </footer>

      {/* HumanPass Modal */}
      <HumanPassModal
        isOpen={isHumanPassModalOpen}
        onClose={() => setIsHumanPassModalOpen(false)}
        onComplete={handleHumanPassComplete}
      />
    </div>
  );
}
