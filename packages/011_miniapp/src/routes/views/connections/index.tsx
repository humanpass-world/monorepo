import {
  useGetMiniappVerifiedSocialList,
  useGetMiniappVerifiedWalletList,
} from "@/lib/generated/react-query";
import { useNavigate } from "react-router";
import BackButton from "../../../../components/backButton/link-button";
import ConnectionCardItem from "../../../../components/connectionCardItem/connection-card-item";
import ConnectionChips from "../../../../components/connectionChips/connections-chips";
import EmptyBox from "../../../../components/emptyBox/empty-box";
import Heading from "../../../../components/heading/heading";
import Skeleton from "../../../../components/skeleton";
import { useConnectionsStore } from "../../../../src/store";
export default function Connections() {
  const navigate = useNavigate();
  const { selectedFilter } = useConnectionsStore();

  const { data: verifiedWalletList, isLoading: isLoadingVerifiedWalletList } =
    useGetMiniappVerifiedWalletList();

  const { data: verifiedSocialList, isLoading: isLoadingVerifiedSocialList } =
    useGetMiniappVerifiedSocialList();

  const isLoading = isLoadingVerifiedWalletList || isLoadingVerifiedSocialList;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
      }}
    >
      {/* <AnimatedBackgrounds
        style={{ height: "100%", position: "absolute", zIndex: -1 }}
        variant="Pulser"
      /> */}
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
          <Heading text="Connections" style={{ width: "100%" }} />
          <ConnectionChips
            style={{ width: "100%" }}
            variant={selectedFilter}
            appText={
              isLoading
                ? "Wallets"
                : `Wallets (${verifiedWalletList?.list.length ?? 0})`
            }
            socialText={
              isLoading
                ? "Social accounts"
                : `Social accounts (${verifiedSocialList?.list.length ?? 0})`
            }
          />
          {isLoading ? (
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
          ) : selectedFilter === "App" ? (
            <div
              style={{
                display: "flex",
                width: "100%",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              {verifiedWalletList?.list.map((request, index) => (
                <ConnectionCardItem
                  style={{ width: "100%", height: 92 }}
                  key={`${request.address}-${index}`}
                  title={request.address}
                  subtitle={""}
                  image={"/chain-icons/ethereum.png"}
                  badgeImage={""}
                  rightText="Disconnect"
                  onClick={() => {
                    navigate(`/disconnect?id=${request.requestId}`);
                  }}
                />
              ))}
              {verifiedWalletList?.list.length === 0 && (
                <EmptyBox
                  text="No wallets connected"
                  style={{ width: "100%", height: 92 }}
                />
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
                <ConnectionCardItem
                  style={{
                    width: "100%",
                    height: 92,
                  }}
                  title={`@${social.username}`}
                  subtitle={"X/Twitter"}
                  image={"/app-icons/x.jpg"}
                  variant="No badge"
                  onClick={() =>
                    navigate(
                      `/disconnect-social?username=${social.username}&id=${social.id}`
                    )
                  }
                  rightText="Disconnect"
                />
              ))}
              {verifiedSocialList?.list.length === 0 && (
                <EmptyBox
                  text="No social accounts connected"
                  style={{ width: "100%", height: 92 }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
