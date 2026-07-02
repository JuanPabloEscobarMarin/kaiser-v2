import { useEffect, useState } from "react";
import { employeePortalApi } from "@/core/api";
import type { EmployeeNotification } from "@/core/api/employee-portal.api";

export function NotificationBell() {
  const [items, setItems] = useState<EmployeeNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  const load = () =>
    employeePortalApi
      .notifications()
      .then((r) => {
        setItems(r.items);
        setUnread(r.unread);
      })
      .catch(() => {});

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, []);

  const toggle = async () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unread > 0) {
      try {
        await employeePortalApi.markAllNotificationsRead();
        setUnread(0);
      } catch {
        /* noop */
      }
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <button
        type="button"
        className="btn btn-ghost btn-circle"
        onClick={toggle}
        aria-label="Notificaciones"
      >
        <div className="indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          {unread > 0 && (
            <span className="badge badge-xs badge-primary indicator-item">
              {unread}
            </span>
          )}
        </div>
      </button>
      {open && (
        <ul className="dropdown-content menu bg-base-100 rounded-box shadow-lg w-72 max-h-96 overflow-y-auto z-50 mt-2 flex-nowrap">
          {items.length === 0 ? (
            <li className="p-3 text-sm opacity-60">Sin notificaciones</li>
          ) : (
            items.map((n) => (
              <li
                key={n.id}
                className={`border-b border-base-200 last:border-0 ${
                  n.read ? "" : "bg-primary/5"
                }`}
              >
                <div className="flex flex-col items-start gap-0.5 py-2">
                  <span className="font-medium text-sm">{n.title}</span>
                  {n.body && (
                    <span className="text-xs opacity-70">{n.body}</span>
                  )}
                  <span className="text-[10px] opacity-40">
                    {n.createdAt.slice(0, 16).replace("T", " ")}
                  </span>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
