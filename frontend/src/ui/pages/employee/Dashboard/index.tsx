import { useEffect, useState } from "react";
import { employeePortalApi } from "@/core/api";
import type { EmployeeProfile } from "@/core/api/employee-portal.api";
import type { Sale } from "@/core/api/sales.api";
import type { Appointment } from "@/core/types";
import { CountUp } from "@/ui/components/CountUp";
import { Reveal } from "@/ui/components/Reveal";
import { StatsSkeleton } from "@/ui/components/Skeletons";
import { formatCurrency } from "@/lib/format";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("es-CO", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export function EmployeeDashboard() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      employeePortalApi.me(),
      employeePortalApi.myAppointments(),
      employeePortalApi.mySales(),
    ])
      .then(([p, a, s]) => {
        setProfile(p);
        setAppointments(a);
        setSales(s);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <StatsSkeleton count={4} />;
  }

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.state === "SCHEDULED" && new Date(a.scheduledAt) > now,
  );
  const finished = appointments.filter((a) => a.state === "FINISHED");

  const serviceCommission = finished.reduce((sum, a) => {
    const price = Number(a.service?.price ?? 0) - Number(a.service?.discount ?? 0);
    const svcAssignment = profile?.services?.find((s) => s.id === a.serviceId);
    const pct = Number(svcAssignment?.commission ?? 0);
    return sum + (price * pct) / 100;
  }, 0);
  const productCommission = sales.reduce(
    (sum, s) => sum + Number(s.commissionTotal),
    0,
  );
  const totalCommission = serviceCommission + productCommission;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Hola, {profile?.fullName?.split(" ")[0] ?? "empleado"}{" "}
          <span className="animate-wave">👋</span>
        </h1>
        <p className="text-sm opacity-60">Tu resumen de actividad</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Reveal index={0}>
          <div className="stat bg-base-100 rounded-box shadow h-full transition-shadow duration-300 hover:shadow-lg">
            <div className="stat-title">Próximas citas</div>
            <div className="stat-value text-primary">
              <CountUp value={upcoming.length} />
            </div>
          </div>
        </Reveal>
        <Reveal index={1}>
          <div className="stat bg-base-100 rounded-box shadow h-full transition-shadow duration-300 hover:shadow-lg">
            <div className="stat-title">Citas finalizadas</div>
            <div className="stat-value">
              <CountUp value={finished.length} />
            </div>
          </div>
        </Reveal>
        <Reveal index={2}>
          <div className="stat bg-base-100 rounded-box shadow h-full transition-shadow duration-300 hover:shadow-lg">
            <div className="stat-title">Servicios asignados</div>
            <div className="stat-value">
              <CountUp value={profile?.services?.length ?? 0} />
            </div>
          </div>
        </Reveal>
        <Reveal index={3}>
          <div className="stat bg-base-100 rounded-box shadow h-full transition-shadow duration-300 hover:shadow-lg">
            <div className="stat-title">Comisión acumulada</div>
            <div className="stat-value text-success text-2xl">
              <CountUp value={totalCommission} format={formatCurrency} />
            </div>
          </div>
        </Reveal>
      </div>

      {/* Próximas citas */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="font-bold text-lg">Próximas citas</h2>
          {upcoming.length === 0 ? (
            <p className="text-sm opacity-60">Sin citas próximas</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.slice(0, 5).map((a) => (
                <li
                  key={a.id}
                  className="flex justify-between items-center p-3 rounded-box border border-base-300"
                >
                  <div>
                    <p className="font-medium">{a.service?.name ?? "—"}</p>
                    <p className="text-xs opacity-60">
                      {a.booking?.customer?.fullName ?? "Cliente sin nombre"}
                    </p>
                  </div>
                  <span className="text-sm font-semibold opacity-70">
                    {formatDate(a.scheduledAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Servicios y comisiones */}
      {profile?.services && profile.services.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h2 className="font-bold text-lg">Mis servicios</h2>
            <div className="flex flex-wrap gap-2">
              {profile.services.map((s) => (
                <div key={s.id} className="badge badge-outline gap-1">
                  {s.name}
                  {Number(s.commission) > 0 && (
                    <span className="text-success ml-1">{s.commission}%</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
