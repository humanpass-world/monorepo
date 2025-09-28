export const upsertNotificationAudience = async (params: {
  appId: string;
  address: string;
  enabled?: boolean;
}) => {
  (window as any).nsdk.setUser(
    params.appId,
    params.address,
    params.enabled ?? true
  );
};
