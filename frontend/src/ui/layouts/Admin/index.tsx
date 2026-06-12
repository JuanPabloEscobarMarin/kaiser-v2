import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { AvatarMenu } from "../components/avatarMenu";
import { BaseAlert } from "@/ui/components/base/BaseAlert";
import { useNotify } from "@/ui/hooks/useNotify";
import { useAuth } from "@/ui/hooks/useAuth";
import { useBranding } from "@/ui/contexts/branding/context";
import { BaseIcon } from "@/ui/components/base/BaseIcon";
import { resourcesApi } from "@/core/api";

const SIDEBAR_KEY = "admin-sidebar-collapsed";

const NAV_ITEMS = [
  { to: "/admin/dashboard", icon: "dashboard" as const, label: "Dashboard" },
  { to: "/admin/services", icon: "scissors" as const, label: "Servicios" },
  { to: "/admin/employees", icon: "users" as const, label: "Empleados" },
  { to: "/admin/appointments", icon: "calendar" as const, label: "Citas" },
  { to: "/admin/reports", icon: "list" as const, label: "Reportes" },
  { to: "/admin/inventory", icon: "list" as const, label: "Inventario" },
  { to: "/admin/products", icon: "store" as const, label: "Productos" },
  { to: "/admin/sales", icon: "list" as const, label: "Ventas" },
  { to: "/admin/settings", icon: "store" as const, label: "Configuración" },
];

export function AdminLayout() {
  const notify = useNotify();
  const { user } = useAuth();
  const { name, business } = useBranding();
  const logoUrl = business?.logoSlug ? resourcesApi.imageUrl(business.logoSlug) : null;
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_KEY) === "1",
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="drawer lg:drawer-open">
      <input id="admin-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content">
        <nav className="flex justify-between navbar w-full bg-base-300">
          <div className="flex items-center">
            {/* Mobile: open drawer overlay */}
            <label
              htmlFor="admin-drawer"
              aria-label="open sidebar"
              className="btn btn-square btn-ghost lg:hidden"
            >
              <BaseIcon
                icon="slide"
                size={24}
                color="currentColor"
                viewBox="0 0 24 24"
              />
            </label>
            {/* Desktop: collapse / expand sidebar */}
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="hidden lg:inline-flex btn btn-square btn-ghost"
              aria-label={
                collapsed ? "Expandir menú lateral" : "Minimizar menú lateral"
              }
              title={collapsed ? "Expandir menú" : "Minimizar menú"}
            >
              <BaseIcon
                icon="slide"
                size={24}
                color="currentColor"
                viewBox="0 0 24 24"
              />
            </button>
            <div className="px-4 font-semibold">
              Hola, {user?.username ?? "admin"}
            </div>
          </div>
          <AvatarMenu />
        </nav>

        <div className="p-4">
          <Outlet />
          {notify.isVisible ? (
            <BaseAlert
              label={notify.message.label}
              variant={notify.message.type}
              leaving={notify.isLeaving}
            />
          ) : null}
        </div>
      </div>

      <div className="drawer-side">
        <label
          htmlFor="admin-drawer"
          aria-label="close sidebar"
          className="drawer-overlay"
        />
        <div
          className={`flex min-h-full flex-col items-start bg-base-200 transition-[width] duration-200 ${
            collapsed ? "lg:w-16" : "lg:w-64"
          } w-64`}
        >
          <div
            className={`pt-5 font-bold text-lg w-full flex items-center ${
              collapsed ? "lg:justify-center lg:px-0" : "px-4"
            }`}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={name}
                className={collapsed ? "h-8 w-8 object-contain" : "h-8 max-w-[140px] object-contain"}
              />
            ) : (
              collapsed ? name.charAt(0).toUpperCase() : name
            )}
          </div>

          <ul className="menu w-full grow pt-4">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      isActive ? "active" : "",
                      collapsed
                        ? "lg:tooltip lg:tooltip-right lg:justify-center"
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")
                  }
                  data-tip={collapsed ? item.label : undefined}
                >
                  <BaseIcon
                    icon={item.icon}
                    size={20}
                    color="currentColor"
                    viewBox="0 0 24 24"
                  />
                  <span className={collapsed ? "lg:hidden" : "animate-section-in"}>
                    {item.label}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
