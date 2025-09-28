import { useWorldAuthStore } from "@hp/client-common";
import { Route, Routes } from "react-router";
import AppRoutes from ".";
import "./app.css";
import LoginScreen from "./views/login/LoginScreen";
import VerifySocialOAuthResult from "./views/verify-social-oauth-result";

export default function App() {
  const { isInitialized, isAuthenticated } = useWorldAuthStore();
  console.log(isInitialized, isAuthenticated);

  if (!isInitialized) {
    return <></>;
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="/verify-social-oauth-result"
          element={<VerifySocialOAuthResult />}
        />
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  return <AppRoutes />;
}
