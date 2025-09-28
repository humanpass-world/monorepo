import "@/utils/state/initialize-state";
import { useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router";
import { useNavStore } from "../store";
import ComingSoon from "./views/coming-soon";
import Connections from "./views/connections";
import Disconnect from "./views/disconnect";
import DisconnectSocial from "./views/disconnect-social";
import Main from "./views/main";
import NotFound from "./views/not-found";
import Verify from "./views/verify";
import VerifySocial from "./views/verify-social";
import VerifyPinCode from "./views/verify/pinCode";

export default function AppRoutes() {
  const navigate = useNavigate();
  const setNavigate = useNavStore((s) => s.setNavigate);

  useEffect(() => {
    setNavigate(navigate);
  }, [navigate, setNavigate]);

  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/connections" element={<Connections />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/verify-pincode" element={<VerifyPinCode />} />
      <Route path="/verify-social" element={<VerifySocial />} />
      <Route path="/disconnect" element={<Disconnect />} />
      <Route path="/disconnect-social" element={<DisconnectSocial />} />
      <Route path="/coming-soon" element={<ComingSoon />} />
      {/* Catch-all route for any non-api routes that don't match */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
