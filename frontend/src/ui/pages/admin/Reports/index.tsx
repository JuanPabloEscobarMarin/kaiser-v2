import { useEffect, useMemo, useState } from "react";
import { appointmentsApi } from "@/core/api";
import type { Appointment } from "@/core/types";
import {
  formatRange,
  presetRange,
  type DateRange,
  type Preset,
} from "../Dashboard/utils";
import { DateRangeFilter } from "../Dashboard/components/DateRangeFilter";
import {
  customerStats,
  filterByRange,
  heatmap,
  previousRange,
  returnRate,
  summarize,
} from "./utils";
import { PeriodComparison } from "./components/PeriodComparison";
import { TopCustomers } from "./components/TopCustomers";
import { ReturnRate } from "./components/ReturnRate";
import { Heatmap } from "./components/Heatmap";
import { ExportSection } from "./components/ExportSection";
import { StatsSkeleton } from "@/ui/components/Skeletons";

const RETURN_WINDOW_DAYS = 60;

export function ReportsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<Preset>("MONTH");
  const [range, setRange] = useState<DateRange>(() => presetRange("MONTH"));

  useEffect(() => {
    appointmentsApi
      .list()
      .then(setAppointments)
      .finally(() => setLoading(false));
  }, []);

  const current = useMemo(
    () => filterByRange(appointments, range),
    [appointments, range],
  );
  const previous = useMemo(
    () => filterByRange(appointments, previousRange(range)),
    [appointments, range],
  );

  const summaryCurrent = useMemo(() => summarize(current), [current]);
  const summaryPrevious = useMemo(() => summarize(previous), [previous]);
  const customers = useMemo(() => customerStats(current), [current]);
  // Return rate is computed over the full dataset (business-level metric)
  const ret = useMemo(
    () => returnRate(appointments, RETURN_WINDOW_DAYS),
    [appointments],
  );
  const heat = useMemo(() => heatmap(current), [current]);

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-sm opacity-70">{formatRange(range)}</p>
        </div>
        <DateRangeFilter
          range={range}
          preset={preset}
          onChange={(p, r) => {
            setPreset(p);
            setRange(r);
          }}
        />
      </header>

      {loading ? (
        <StatsSkeleton count={6} />
      ) : (
        <>
          <PeriodComparison
            current={summaryCurrent}
            previous={summaryPrevious}
          />

          <TopCustomers rows={customers} />

          <ReturnRate result={ret} windowDays={RETURN_WINDOW_DAYS} />

          <Heatmap data={heat} />

          <ExportSection appointments={current} />
        </>
      )}

      <div className="h-8" />
    </div>
  );
}
