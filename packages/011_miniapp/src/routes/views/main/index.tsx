import {
  useGetMiniappVerifiedSocialList,
  useGetMiniappVerifiedWalletList,
} from "@/lib/generated/react-query";
import { useWorldPermissionStore } from "@hp/client-common";
import { Permission } from "@worldcoin/minikit-js";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import AppIcon from "../../../../components/appIcon/app-icon";
import ConnectionFilter from "../../../../components/connectionFilter/connection-filter";
import ConnectionSectionHeader from "../../../../components/main/connection-section-header";
import ContentContainer from "../../../../components/main/content-container";
import Navigation from "../../../../components/main/navigation";
import PortfolioCard from "../../../../components/main/portfolio-card";
import SocialAccountItem from "../../../../components/main/social-account-item";
import WalletEmpty from "../../../../components/main/wallet-empty";
import WalletItem from "../../../../components/main/wallet-item";
import MainBackground from "../../../../components/mainBackground/main-background";
import Skeleton from "../../../../components/skeleton";
import { useMainStore } from "../../../../src/store";
export default function Main() {
  const connectedChains = [];
  const totalBalanceInteger = "200";
  const totalBalanceDecimal = ".52";
  const diffText = "+0.33% ($0.36) Today";
  const { safeRequestPermission } = useWorldPermissionStore();

  useEffect(() => {
    safeRequestPermission(Permission.Notifications, {
      onSuccess: () => {
        console.log("success");
      },
    });
  }, []);

  const { data: verifiedWalletList, isLoading: isLoadingVerifiedWalletList } =
    useGetMiniappVerifiedWalletList();

  const { selectedFilter } = useMainStore();
  // const navigate = useNavStore((s) => s.navigate);
  const navigate = useNavigate();

  const { data: verifiedSocialList } = useGetMiniappVerifiedSocialList();

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <MainBackground
        style={{ height: "100%", position: "absolute", zIndex: -1 }}
      />
      <Navigation
        style={{
          width: "100%",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 100,
        }}
        onClickIconButton={() => alert("test")}
      />
      <ContentContainer style={{ width: "100%" }}>
        {isLoadingVerifiedWalletList ? (
          <Skeleton height="125px" />
        ) : (
          <PortfolioCard
            style={{ width: "100%" }}
            price1={totalBalanceInteger}
            price2={totalBalanceDecimal}
            chainCount={`+${connectedChains.length} chains`}
            diff={diffText}
            variant={"real"}
          />
        )}
        <ConnectionSectionHeader style={{ width: "100%" }} />
        <ConnectionFilter
          style={{ width: "100%" }}
          variant={selectedFilter}
          walletText={
            isLoadingVerifiedWalletList
              ? "Wallets"
              : `Wallets (${verifiedWalletList?.list.length ?? 0})`
          }
          socialText={
            isLoadingVerifiedWalletList
              ? "Social accounts"
              : `Social accounts (${verifiedSocialList?.list.length ?? 0})`
          }
        />
        {isLoadingVerifiedWalletList ? (
          <div
            style={{
              display: "flex",
              width: "100%",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <Skeleton height="92px" />
            <Skeleton height="92px" />
            <Skeleton height="92px" />
          </div>
        ) : selectedFilter === "Wallet" ? (
          <div
            style={{
              display: "flex",
              width: "100%",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {verifiedWalletList?.list.map((wallet, index) => (
              <WalletItem
                style={{ width: "100%" }}
                key={`${wallet.address}-${index}`}
                variant={"real"}
                walletAddress={wallet.address}
                description={`${wallet.chains.length} Chain`}
                appsLabel={""}
                appIcons={
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      gap: "2px",
                    }}
                  >
                    {wallet.chains.map((chain, index) => {
                      return (
                        <AppIcon
                          variant="With ChainIcon"
                          appIcon={"/chain-icons/ethereum.png"}
                          chainIcon={""}
                          style={{ display: "flex" }}
                          key={`${index}`}
                        />
                      );
                    })}
                  </div>
                }
              />
            ))}
            {verifiedWalletList?.list.length === 0 && (
              <WalletEmpty style={{ width: "100%", height: 92 }} />
            )}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              width: "100%",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {verifiedSocialList?.list.map((social) => (
              <SocialAccountItem
                style={{ width: "100%" }}
                variant={"connected"}
                twitterHandle={`@${social.username}`}
              />
            ))}
            <SocialAccountItem
              style={{ width: "100%" }}
              variant={"twitter"}
              twitterHandle={"Connect your X/Twitter account"}
              onClick={() => {
                location.replace(
                  `${import.meta.env.VITE_API_URL}/miniapp/verify/social/x`
                );
              }}
            />
            <SocialAccountItem
              style={{ width: "100%" }}
              variant={"telegram"}
              twitterHandle={"Connect your Telegram account"}
              onClick={() => navigate("/coming-soon", { replace: false })}
            />
            <SocialAccountItem
              style={{ width: "100%" }}
              variant={"farcaster"}
              twitterHandle={"Connect your Farcaster account"}
              onClick={() => navigate("/coming-soon", { replace: false })}
            />
          </div>
        )}
      </ContentContainer>
    </div>
  );
}
