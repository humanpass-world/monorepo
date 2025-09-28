import type { Tokens, VerificationLevel } from "@worldcoin/minikit-js";
import { MiniKit, tokenToDecimals } from "@worldcoin/minikit-js";
import { create } from "zustand";
import { devtools, persist, subscribeWithSelector } from "zustand/middleware";

export type WorldAuthState = {
  // State
  isLoading: boolean;
  isInitialized: boolean; // Has the provider been initialized?
  isInstalled: boolean; // Are we running in the World App?
  isAuthenticated: boolean; // Session should not be null if isAuthenticated is true
  // user data
  user: {
    address: `0x${string}`;
    username?: string;
    profilePictureUrl: string;
  } | null;
};

export type WorldAuthActions = {
  // Actions
  checkSession: () => Promise<void>;
  signInWallet: (
    completeSiweAdditionalParams?: any
  ) => Promise<{ success: boolean; error?: string }>;
  verify: (params: {
    action: string;
    signal?: string;
    verificationLevel: VerificationLevel;
  }) => Promise<{ success: boolean; error?: string; data?: unknown }>;
  pay: ({
    amount,
    token,
    recipient,
  }: {
    amount: number;
    token: Tokens;
    recipient: string;
  }) => Promise<{ success: boolean }>;
  // Internal state setters
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setInstalled: (installed: boolean) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setUser: (user: WorldAuthState["user"]) => void;
};

export type WorldAuthStore = WorldAuthState & WorldAuthActions;

const initialState: WorldAuthState = {
  isLoading: true,
  isInitialized: false,
  isInstalled: false,
  isAuthenticated: false,
  user: null,
};

export const useWorldAuthStore = create<WorldAuthStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          ...initialState,

          // State setters
          setLoading: (loading) => set({ isLoading: loading }),
          setInitialized: (initialized) => set({ isInitialized: initialized }),
          setInstalled: (installed) => set({ isInstalled: installed }),
          setAuthenticated: (authenticated) =>
            set({ isAuthenticated: authenticated }),
          setUser: (user) => set({ user }),

          // Actions
          checkSession: async () => {
            const { isInitialized } = get();
            if (isInitialized) {
              try {
                const res = await fetch(
                  `${import.meta.env.VITE_API_URL}/miniapp/auth/session`,
                  {
                    credentials: "include",
                  }
                );

                if (res.ok) {
                  const data = (await res.json()) as {
                    address: `0x${string}`;
                    username: string;
                    profilePictureUrl: string;
                  };

                  set({
                    isAuthenticated: true,
                    isLoading: false,
                    user: data,
                  });
                } else {
                  throw new Error("Failed to get session");
                }
              } catch {
                set({
                  isAuthenticated: false,
                  isLoading: false,
                });
              }
            }
          },

          verify: async (params) => {
            const { finalPayload } = await MiniKit.commandsAsync.verify({
              action: params.action,
              signal: params.signal,
              verification_level: params.verificationLevel,
            });

            if (finalPayload.status === "error") {
              return {
                success: false as const,
                error: finalPayload.error_code,
              };
            }

            return {
              success: true as const,
              data: finalPayload,
            };

            // try {
            //   const res = await fetch("/api/verify", {
            //     method: "POST",
            //     headers: {
            //       "Content-Type": "application/json",
            //     },
            //     body: JSON.stringify({
            //       payload: finalPayload as ISuccessResult,
            //       action: params.action,
            //       signal: params.signal,
            //     }),
            //   });

            //   const data = await res.json();
            //   return {
            //     success: true,
            //     data: data.data,
            //   };
            // } catch {
            //   return {
            //     success: false,
            //     error: "failed due to exception",
            //   };
            // }
          },

          signInWallet: async (completeSiweAdditionalParams?: any) => {
            const { isInstalled } = get();

            if (!isInstalled) {
              return { success: false, error: "not installed" };
            }

            set({ isLoading: true });

            try {
              const res = await fetch(
                `${import.meta.env.VITE_API_URL}/miniapp/auth/nonce`
              );
              const { nonce, hmac } = await res.json();

              const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
                nonce,
                requestId: "0",
                expirationTime: new Date(
                  new Date().getTime() + 7 * 24 * 60 * 60 * 1000
                ),
                notBefore: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
                statement:
                  "This is my statement and here is a link https://worldcoin.com/apps",
              });

              if (finalPayload.status === "error") {
                set({ isLoading: false });
                return { success: false };
              }

              const response = await fetch(
                `${import.meta.env.VITE_API_URL}/miniapp/auth/complete-siwe`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({
                    payload: finalPayload,
                    nonce,
                    hmac,
                    ...completeSiweAdditionalParams,
                  }),
                }
              );

              const { userData } = await response.json();

              if (userData) {
                set({
                  isAuthenticated: true,
                  isLoading: false,
                  user: userData,
                });
                return { success: true };
              }

              set({
                isAuthenticated: false,
                isLoading: false,
              });
              return { success: false, error: "sign-in failed" };
            } catch {
              set({
                isAuthenticated: false,
                isLoading: false,
              });
              return { success: false, error: "failed due to exception" };
            }
          },

          pay: async ({ amount, token, recipient }) => {
            const payload = {
              to: recipient,
              reference: "0",
              tokens: [
                {
                  symbol: token,
                  token_amount: tokenToDecimals(amount, token).toString(),
                },
              ],
              description: "Sending WLD",
            };
            await MiniKit.commandsAsync.pay(payload);
            return { success: true };
          },
        }),
        {
          name: "world-auth-store",
        }
      )
    )
  )
);
