import { MiniKit } from "@worldcoin/minikit-js";

export const getSafeAreaInsets = () => {
    return MiniKit.deviceProperties.safeAreaInsets;
};

export const getSafeAreaInsetsBottom = () => {
    return MiniKit.deviceProperties.safeAreaInsets?.bottom;
};