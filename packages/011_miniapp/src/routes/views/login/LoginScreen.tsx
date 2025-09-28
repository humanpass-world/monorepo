import { useWorldAuthStore } from "@hp/client-common";
import { useState } from "react";

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const { signInWallet } = useWorldAuthStore();

  const handleLogin = async () => {
    setLoading(true);
    await signInWallet();
    setLoading(false);
  };

  return (
    <div className="min-h-full w-full flex flex-col items-center justify-between bg-gradient-to-b text-white p-6">
      <div className="flex-1 flex items-center justify-center">
        <span className="text-6xl font-black tracking-wide font-raleway select-none text-x-blue">
          Human Pass
        </span>
      </div>

      <div className="w-full rounded-xl animate-fadeIn">
        {loading ? (
          "loading..."
        ) : (
          <button
            className="w-full h-[52px] py-3 rounded-lg font-bold bg-x-blue text-white hover:bg-x-blue/80 transition-all duration-200 flex items-center justify-center gap-2"
            onClick={handleLogin}
          >
            로그인
          </button>
        )}
      </div>
    </div>
  );
}
