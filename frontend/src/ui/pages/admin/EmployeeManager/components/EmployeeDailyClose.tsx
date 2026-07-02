import { useEffect, useState } from "react";
import { reportsApi } from "@/core/api";
import type { DailyClose } from "@/core/api/reports.api";
import { DailyCloseView } from "@/ui/components/DailyCloseView";

const today = () => new Date().toISOString().slice(0, 10);

export function EmployeeDailyClose({ employeeId }: { employeeId: string }) {
  const [date, setDate] = useState(today());
  const [data, setData] = useState<DailyClose | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) return;
    let active = true;
    reportsApi
      .dailyClose(employeeId, date)
      .then((d) => {
        if (active) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setData(null);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [employeeId, date]);

  return (
    <fieldset className="border border-base-300 rounded-lg p-3">
      <legend className="font-semibold px-1">Cierre diario</legend>
      <input
        type="date"
        className="input input-bordered input-sm mb-3"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {loading ? (
        <span className="loading loading-spinner" />
      ) : data ? (
        <DailyCloseView data={data} />
      ) : (
        <p className="text-sm opacity-60">Sin datos para esta fecha.</p>
      )}
    </fieldset>
  );
}
