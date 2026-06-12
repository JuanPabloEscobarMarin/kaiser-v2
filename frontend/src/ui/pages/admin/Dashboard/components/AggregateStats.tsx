import {
  formatDuration,
  formatPrice,
  type AggregateStats as Stats,
} from "../utils";
import { CountUp } from "@/ui/components/CountUp";
import { Reveal } from "@/ui/components/Reveal";

interface Props {
  stats: Stats;
}

export function AggregateStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <Reveal index={0}>
        <div className="stats shadow bg-base-100 w-full transition-shadow duration-300 hover:shadow-lg">
          <div className="stat">
            <div className="stat-title">Citas totales</div>
            <div className="stat-value">
              <CountUp value={stats.total} />
            </div>
            <div className="stat-desc">
              <span className="text-info">{stats.scheduled} agendadas</span> ·{" "}
              <span className="text-success">{stats.finished} finalizadas</span>{" "}
              · <span className="text-error">{stats.cancelled} canceladas</span>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal index={1}>
        <div className="stats shadow bg-base-100 w-full transition-shadow duration-300 hover:shadow-lg">
          <div className="stat">
            <div className="stat-title">Ingresos esperados</div>
            <div className="stat-value text-primary">
              <CountUp value={stats.expectedRevenue} format={formatPrice} />
            </div>
            <div className="stat-desc">Citas no canceladas</div>
          </div>
        </div>
      </Reveal>

      <Reveal index={2}>
        <div className="stats shadow bg-base-100 w-full transition-shadow duration-300 hover:shadow-lg">
          <div className="stat">
            <div className="stat-title">Ingresos confirmados</div>
            <div className="stat-value text-success">
              <CountUp value={stats.confirmedRevenue} format={formatPrice} />
            </div>
            <div className="stat-desc">Solo citas finalizadas</div>
          </div>
        </div>
      </Reveal>

      <Reveal index={3} className="sm:col-span-2 lg:col-span-2">
        <div className="stats shadow bg-base-100 w-full transition-shadow duration-300 hover:shadow-lg">
          <div className="stat">
            <div className="stat-title">Tiempo agendado</div>
            <div className="stat-value">
              <CountUp
                value={stats.scheduledMinutes}
                format={(n) => formatDuration(Math.round(n))}
              />
            </div>
            <div className="stat-desc">Suma de duración de citas activas</div>
          </div>
        </div>
      </Reveal>

      <Reveal index={4}>
        <div className="stats shadow bg-base-100 w-full transition-shadow duration-300 hover:shadow-lg">
          <div className="stat">
            <div className="stat-title">Tasa de finalización</div>
            <div className="stat-value">
              {stats.total === 0 ? (
                "—"
              ) : (
                <CountUp
                  value={Math.round((stats.finished / stats.total) * 100)}
                  format={(n) => `${Math.round(n)}%`}
                />
              )}
            </div>
            <div className="stat-desc">
              {stats.finished} / {stats.total}
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
