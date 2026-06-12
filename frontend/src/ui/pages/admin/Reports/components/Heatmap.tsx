import {
  HEATMAP_DAYS,
  HEATMAP_HOUR_END,
  HEATMAP_HOUR_START,
  type HeatmapResult,
} from "../utils";

interface Props {
  data: HeatmapResult;
}

export function Heatmap({ data }: Props) {
  const hours: number[] = [];
  for (let h = HEATMAP_HOUR_START; h <= HEATMAP_HOUR_END; h++) hours.push(h);

  const intensity = (count: number) => {
    if (data.max === 0 || count === 0) return 0;
    return count / data.max;
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-lg font-semibold">Heatmap de horarios</h2>
        <p className="text-xs opacity-60">
          Pico de demanda: {data.max} cita{data.max === 1 ? "" : "s"}
        </p>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body p-4 overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <th />
                {hours.map((h) => (
                  <th
                    key={h}
                    className="px-1 py-1 font-medium text-center w-9"
                  >
                    {String(h).padStart(2, "0")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {HEATMAP_DAYS.map((label, dow) => (
                <tr key={label}>
                  <th className="pr-2 text-right font-medium">{label}</th>
                  {hours.map((h, i) => {
                    const count = data.grid[dow]?.[i] ?? 0;
                    const op = intensity(count);
                    return (
                      <td
                        key={h}
                        className="border border-base-200 animate-cell-in transition-transform duration-150 hover:scale-110 hover:z-10 relative"
                        style={{
                          animationDelay: `${(dow + i) * 15}ms`,
                          backgroundColor:
                            op === 0
                              ? "var(--color-base-200)"
                              : `color-mix(in oklch, var(--color-primary) ${op * 100}%, transparent)`,
                        }}
                        title={`${label} ${String(h).padStart(2, "0")}:00 — ${count} cita${count === 1 ? "" : "s"}`}
                      >
                        <div className="w-9 h-7 flex items-center justify-center">
                          {count > 0 && (
                            <span
                              className={
                                op > 0.5 ? "text-primary-content" : ""
                              }
                            >
                              {count}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center gap-2 mt-3 text-xs opacity-70">
            <span>Menos</span>
            {[0, 0.25, 0.5, 0.75, 1].map((op) => (
              <div
                key={op}
                className="w-6 h-3 rounded"
                style={{
                  backgroundColor:
                    op === 0
                      ? "var(--color-base-200)"
                      : `color-mix(in oklch, var(--color-primary) ${op * 100}%, transparent)`,
                }}
              />
            ))}
            <span>Más</span>
          </div>
        </div>
      </div>
    </section>
  );
}
