import { formatPercent, type ReturnRateResult } from "../utils";
import { CountUp } from "@/ui/components/CountUp";

interface Props {
  result: ReturnRateResult;
  windowDays: number;
}

export function ReturnRate({ result, windowDays }: Props) {
  const pct = result.rate;
  const color =
    pct >= 0.5 ? "text-success" : pct >= 0.25 ? "text-warning" : "text-error";

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Tasa de retorno</h2>
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm opacity-70 mb-1">
                Clientes que regresaron en menos de {windowDays} días
              </p>
              <div className={`text-5xl font-bold ${color}`}>
                {result.total === 0 ? (
                  "—"
                ) : (
                  <CountUp
                    value={pct}
                    format={(n) => formatPercent(n, 0)}
                    durationMs={800}
                  />
                )}
              </div>
              <p className="text-sm opacity-60 mt-2">
                <span className="font-bold">{result.returning}</span> de{" "}
                <span className="font-bold">{result.total}</span> clientes
                únicos
              </p>
            </div>
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="text-xs opacity-60 mb-1 flex justify-between">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-base-300 overflow-hidden">
                <div
                  className={`h-full rounded-full animate-bar-grow ${
                    pct >= 0.5
                      ? "bg-success"
                      : pct >= 0.25
                        ? "bg-warning"
                        : "bg-error"
                  }`}
                  style={{
                    width: `${result.total === 0 ? 0 : pct * 100}%`,
                    animationDelay: "200ms",
                  }}
                />
              </div>
              <p className="text-xs opacity-60 mt-2">
                Mide qué tanto de tus clientes son recurrentes. Por encima del
                50% es un negocio sano.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
