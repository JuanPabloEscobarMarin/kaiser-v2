import { useState } from "react";
import { useNavigate } from "react-router";
import { AparienceSwitcher } from "./AparienceSwitcher";
import { useAuth } from "@/ui/hooks/useAuth";
import { resourcesApi } from "@/core/api";
import { ProfileSettingsModal } from "@/ui/components/ProfileSettingsModal";

const initials = (fullName: string) =>
  fullName
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export function AvatarMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const avatarUrl = user?.avatarSlug
    ? resourcesApi.imageUrl(user.avatarSlug)
    : null;

  return (
    <>
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="block cursor-pointer">
          {avatarUrl ? (
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img src={avatarUrl} alt={user?.username ?? "Avatar"} />
              </div>
            </div>
          ) : (
            <div className="avatar avatar-placeholder">
              <div className="bg-neutral text-neutral-content w-10 rounded-full">
                <span className="text-sm font-bold">
                  {initials(user?.username ?? "?")}
                </span>
              </div>
            </div>
          )}
        </div>
        <ul
          tabIndex={0}
          className="dropdown-content mt-2 menu bg-base-100 rounded-box z-10 w-56 p-2 shadow"
        >
          {user && (
            <li className="menu-title">
              <span className="truncate">{user.username}</span>
            </li>
          )}
          <li>
            <button
              type="button"
              onClick={() => {
                setProfileOpen(true);
                (document.activeElement as HTMLElement | null)?.blur();
              }}
            >
              Mi perfil
            </button>
          </li>
          <li>
            <div className="flex flex-row items-center justify-between">
              <span>Apariencia</span>
              <AparienceSwitcher />
            </div>
          </li>
          <div className="divider my-1" />
          <li>
            <button className="text-error" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </li>
        </ul>
      </div>

      <ProfileSettingsModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}
