import { useEffect, useMemo, useState } from "react";
import {
  appointmentsApi,
  employeesApi,
  resourcesApi,
  salesApi,
  servicesApi,
} from "@/core/api";
import { useBranding } from "@/ui/contexts/branding/context";
import type { Appointment, Employee, Service } from "@/core/types";
import type { Sale } from "@/core/api/sales.api";
import { DateRangeFilter } from "./components/DateRangeFilter";
import { AggregateStats } from "./components/AggregateStats";
import { PerEmployeeStats } from "./components/PerEmployeeStats";
import { StatsSkeleton } from "@/ui/components/Skeletons";
import {
  computeAggregate,
  computePerEmployee,
  filterByRange,
  formatPrice,
  formatRange,
  inRange,
  presetRange,
  type DateRange,
  type Preset,
} from "./utils";

export function DashboardPage() {
  const { name, business } = useBranding();
  const logoUrl = business?.logoSlug
    ? resourcesApi.imageUrl(business.logoSlug)
    : null;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);

  const [preset, setPreset] = useState<Preset>("WEEK");
  const [range, setRange] = useState<DateRange>(() => presetRange("WEEK"));

  useEffect(() => {
    Promise.all([
      appointmentsApi.list(),
      employeesApi.list(),
      servicesApi.list(),
      salesApi.list(),
    ])
      .then(([apts, emps, srv, sls]) => {
        setAppointments(apts);
        setEmployees(emps);
        setServices(srv);
        setSales(sls);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () => filterByRange(appointments, range),
    [appointments, range],
  );
  const filteredSales = useMemo(
    () => sales.filter((s) => inRange(s.createdAt, range)),
    [sales, range],
  );
  const productRevenue = useMemo(
    () => filteredSales.reduce((sum, s) => sum + Number(s.total), 0),
    [filteredSales],
  );
  const aggregate = useMemo(() => computeAggregate(filtered), [filtered]);
  const perEmployee = useMemo(
    () => computePerEmployee(filtered, employees, filteredSales),
    [filtered, employees, filteredSales],
  );

  const handleRangeChange = (p: Preset, r: DateRange) => {
    setPreset(p);
    setRange(r);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex items-center gap-3">
          {logoUrl && (
            <img
              src={logoUrl}
              alt={name}
              className="h-12 max-w-[140px] object-contain animate-pop-in"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm opacity-70">{formatRange(range)}</p>
          </div>
        </div>
        <DateRangeFilter
          range={range}
          preset={preset}
          onChange={handleRangeChange}
        />
      </div>

      {loading ? (
        <StatsSkeleton count={6} />
      ) : (
        <>
          <AggregateStats stats={aggregate} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="font-bold text-base">Recursos</h3>
                <ul className="text-sm space-y-2 mt-2">
                  <li className="flex justify-between">
                    <span>Servicios activos</span>
                    <strong>
                      {services.filter((s) => s.state).length}/{services.length}
                    </strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Empleados activos</span>
                    <strong>
                      {employees.filter((e) => e.state).length}/{employees.length}
                    </strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Citas en rango</span>
                    <strong>{filtered.length}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Ventas de productos</span>
                    <strong>{filteredSales.length}</strong>
                  </li>
                  <li className="flex justify-between">
                    <span>Ingresos por productos</span>
                    <strong>{formatPrice(productRevenue)}</strong>
                  </li>
                </ul>
              </div>
            </div>

            <div className="card bg-base-100 shadow lg:col-span-2">
              <div className="card-body">
                <h3 className="font-bold text-base">Servicios más populares</h3>
                <TopServices appointments={filtered} />
              </div>
            </div>
          </div>

          <PerEmployeeStats rows={perEmployee} />
        </>
      )}
    </div>
  );
}

function TopServices({ appointments }: { appointments: Appointment[] }) {
  const counts = new Map<string, { name: string; count: number }>();
  for (const a of appointments) {
    if (!a.service) continue;
    const current = counts.get(a.service.id) ?? {
      name: a.service.name,
      count: 0,
    };
    current.count++;
    counts.set(a.service.id, current);
  }

  const top = Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  if (top.length === 0)
    return (
      <p className="text-sm opacity-60">No hay datos para este rango</p>
    );

  const max = top[0]!.count;

  return (
    <ul className="space-y-2 mt-2">
      {top.map((s, i) => (
        <li
          key={s.name}
          className="flex items-center gap-3 animate-row-in"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <span className="text-sm flex-1 truncate">{s.name}</span>
          <div className="flex-1 h-2 rounded-full bg-base-300 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary animate-bar-grow"
              style={{
                width: `${(s.count / max) * 100}%`,
                animationDelay: `${i * 60 + 150}ms`,
              }}
            />
          </div>
          <span className="text-sm font-semibold w-8 text-right">
            {s.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
