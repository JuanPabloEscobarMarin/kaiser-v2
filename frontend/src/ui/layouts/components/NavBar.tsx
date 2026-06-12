import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "@/ui/hooks/useAuth";
import { useBranding } from "@/ui/contexts/branding/context";
import { resourcesApi } from "@/core/api";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { name, business } = useBranding();
  const navigate = useNavigate();
  const logoUrl = business?.logoSlug ? resourcesApi.imageUrl(business.logoSlug) : null;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-underline ${isActive ? "nav-underline-active" : ""}`;

  return (
    <div
      className={`navbar sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-base-100/80 backdrop-blur-md shadow-md min-h-12 py-0"
          : "bg-base-100 shadow-sm"
      }`}
    >
      <div className="flex-1">
        <Link
          to="/"
          className="text-xl font-bold px-2 flex items-center gap-2 transition-transform duration-200 hover:scale-105 active:scale-95"
        >
          {logoUrl ? (
            <img src={logoUrl} alt={name} className="h-8 max-w-[120px] object-contain" />
          ) : (
            name
          )}
        </Link>
      </div>
      <div className="flex-none">
        <ul className="menu menu-horizontal px-1 items-center gap-1">
          <li>
            <NavLink to="/booking" className={navLinkClass}>
              Reservar
            </NavLink>
          </li>
          {user?.role === "ADMIN" ? (
            <>
              <li>
                <NavLink to="/admin" className={navLinkClass}>
                  Admin
                </NavLink>
              </li>
              <li>
                <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                  Salir
                </button>
              </li>
            </>
          ) : (
            <li>
              <NavLink to="/login" className="btn btn-ghost btn-sm">
                Acceso admin
              </NavLink>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Navbar;
