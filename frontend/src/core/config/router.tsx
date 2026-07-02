import { createBrowserRouter } from "react-router";
import { BookingPage, HomePage, LoginPage } from "@/ui/pages/public";
import { ServiceDetail } from "@/ui/pages/public/ServiceDetail";
import { RootLayout } from "@/ui/layouts/RootLayout";
import { AdminGuard } from "@/ui/layouts/AdminGuard";
import { EmployeeGuard } from "@/ui/layouts/EmployeeGuard";
import { NotifyProvider } from "@/ui/contexts/notify/NotifyProvider";

const router = createBrowserRouter([
  {
    Component: RootLayout,
    children: [
      { path: "/", Component: HomePage },
      {
        path: "/booking",
        children: [
          { index: true, Component: BookingPage },
          { path: ":id", Component: ServiceDetail },
        ],
      },
      { path: "/login", Component: LoginPage },
      {
        path: "/employee",
        Component: EmployeeGuard,
        children: [
          {
            Component: NotifyProvider,
            children: [
              {
                lazy: async () => ({
                  Component: (await import("@/ui/layouts/Employee"))
                    .EmployeeLayout,
                }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (await import("@/ui/pages/employee/Dashboard"))
                        .EmployeeDashboard,
                    }),
                  },
                  {
                    path: "dashboard",
                    lazy: async () => ({
                      Component: (await import("@/ui/pages/employee/Dashboard"))
                        .EmployeeDashboard,
                    }),
                  },
                  {
                    path: "appointments",
                    lazy: async () => ({
                      Component: (
                        await import("@/ui/pages/employee/Appointments")
                      ).EmployeeAppointments,
                    }),
                  },
                  {
                    path: "sales",
                    lazy: async () => ({
                      Component: (await import("@/ui/pages/employee/Sales"))
                        .EmployeeSales,
                    }),
                  },
                  {
                    path: "time-off",
                    lazy: async () => ({
                      Component: (await import("@/ui/pages/employee/TimeOff"))
                        .EmployeeTimeOff,
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        path: "/admin",
        Component: AdminGuard,
        children: [
          {
            Component: NotifyProvider,
            children: [
              {
                lazy: async () => ({
                  Component: (await import("@/ui/layouts/Admin")).AdminLayout,
                }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (
                        await import("@/ui/pages/admin/Dashboard/DashboardPage")
                      ).DashboardPage,
                    }),
                  },
                  {
                    path: "dashboard",
                    lazy: async () => ({
                      Component: (
                        await import("@/ui/pages/admin/Dashboard/DashboardPage")
                      ).DashboardPage,
                    }),
                  },
                  {
                    path: "services",
                    lazy: async () => ({
                      Component: (
                        await import("@/ui/pages/admin/ServiceManager")
                      ).ServiceManager,
                    }),
                  },
                  {
                    path: "employees",
                    lazy: async () => ({
                      Component: (
                        await import(
                          "@/ui/pages/admin/EmployeeManager"
                        )
                      ).EmployeeManager,
                    }),
                  },
                  {
                    path: "appointments",
                    lazy: async () => ({
                      Component: (
                        await import("@/ui/pages/admin/AppointmentManager")
                      ).AppointmentManager,
                    }),
                  },
                  {
                    path: "reports",
                    lazy: async () => ({
                      Component: (await import("@/ui/pages/admin/Reports"))
                        .ReportsPage,
                    }),
                  },
                  {
                    path: "settings",
                    lazy: async () => ({
                      Component: (await import("@/ui/pages/admin/Settings"))
                        .BusinessSettingsPage,
                    }),
                  },
                  {
                    path: "inventory",
                    lazy: async () => ({
                      Component: (
                        await import("@/ui/pages/admin/InventoryManager")
                      ).InventoryManager,
                    }),
                  },
                  {
                    path: "products",
                    lazy: async () => ({
                      Component: (
                        await import("@/ui/pages/admin/ProductManager")
                      ).ProductManager,
                    }),
                  },
                  {
                    path: "sales",
                    lazy: async () => ({
                      Component: (await import("@/ui/pages/admin/SalesManager"))
                        .SalesManager,
                    }),
                  },
                  {
                    path: "promotions",
                    lazy: async () => ({
                      Component: (await import("@/ui/pages/admin/Promotions"))
                        .PromotionsPage,
                    }),
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
