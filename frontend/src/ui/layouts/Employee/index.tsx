import { NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "@/ui/hooks/useAuth";
import { useBranding } from "@/ui/contexts/branding/BrandingProvider";
import { resourcesApi } from "@/core/api";

const NAV_ITEMS = [
  { to: "/employee/dashboard", label: "Dashboard" },
  { to: "/employee/appointments", label: "Mis citas" },
  { to: "/employee/sales", label: "Ventas" },
  { to: "/employee/time-off", label: "Tiempo libre" },
];

export function EmployeeLayout() {
  const { user, logout } = useAuth();
  const { name, business } = useBranding();
  const logoUrl = business?.logoSlug
    ? resourcesApi.imageUrl(business.logoSlug)
    : null;
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "active" : "";

  return (
    <div className="min-h-screen bg-base-200">
      <nav className="navbar bg-base-100 shadow-sm px-3 sm:px-4 gap-2">
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={name}
              className="h-8 max-w-[90px] object-contain"
            />
          ) : (
            <span className="font-bold text-base sm:text-lg truncate">
              {name}
            </span>
          )}
          <span className="badge badge-primary badge-sm hidden sm:inline-flex">
            Empleado
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="text-sm opacity-70 hidden sm:inline">
            {user?.username}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </nav>

      {/* Navegación horizontal — solo móvil/tablet */}
      <div className="lg:hidden bg-base-100 border-b border-base-300 overflow-x-auto">
        <ul className="menu menu-horizontal flex-nowrap px-2 py-1 gap-1 whitespace-nowrap">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} className={linkClass}>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex">
        {/* Sidebar vertical — solo desktop */}
        <aside className="hidden lg:block w-56 min-h-[calc(100vh-64px)] bg-base-100 shadow-sm p-4">
          <ul className="menu w-full">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} className={linkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
