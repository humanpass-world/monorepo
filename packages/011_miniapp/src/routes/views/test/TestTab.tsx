import { useWorldAuthStore, useWorldPermissionStore } from "@hp/client-common";
import { Permission } from "@worldcoin/minikit-js";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function TestTab() {
  const { status, canRequest, safeRequestPermission } =
    useWorldPermissionStore();

  const user = useWorldAuthStore((state) => state.user);
  const { i18n } = useTranslation();

  const LANGS = [
    { code: "en-US", label: "EN" },
    { code: "ko", label: "KR" },
    { code: "ja", label: "JP" },
  ];
  const currentLangIdx = LANGS.findIndex((l) => l.code === i18n.language);
  const langIdx = currentLangIdx === -1 ? 0 : currentLangIdx;
  const nextLang = LANGS[(langIdx + 1) % LANGS.length];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-2 p-4">
        <button
          className="px-4 py-2 rounded font-bold bg-blue-500 text-white transition"
          onClick={() => i18n.changeLanguage(nextLang.code)}
          aria-label="Change language"
        >
          {LANGS[langIdx].label}
        </button>
        <button
          className="px-4 py-2 rounded font-bold bg-blue-500 text-white transition"
          onClick={() => useWorldAuthStore.getState().signOut()}
          aria-label="Sign Out"
        >
          Sign Out
        </button>
      </div>
      <div>
        <h3 className="text-2xl font-bold">User Info</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th>Key</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-center whitespace-nowrap">User</td>
              <td className="text-center whitespace-break-spaces break-all">
                {user?.address}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        <h3 className="text-2xl font-bold">Permission</h3>
        <table className="w-full">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(status).map(([key, value]) => (
              <tr key={key}>
                <td className="text-center">{key}</td>
                <td className="text-center">
                  {value ? "Granted" : "Not Granted"}
                </td>
                <td className="text-center py-2">
                  {canRequest[key as Permission] ? (
                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-md"
                      onClick={() => {
                        safeRequestPermission(key as Permission, {
                          onSuccess: () => {
                            toast.success("success");
                          },
                          onAlreadyDeclined: () => {
                            toast.error("already declined");
                          },
                          onPermissionDisabledOnWorldApp: () => {
                            toast.error("permission disabled on world app");
                          },
                          onDeclined: () => {
                            toast.error("declined");
                          },
                        });
                      }}
                    >
                      Request
                    </button>
                  ) : (
                    "Unable to request"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
