import {
  diff,
  formatPercent,
  formatPrice,
  type PeriodSummary,
} from "../utils";

interface Props {
  current: PeriodSummary;
  previous: PeriodSummary;
}

const Trend = ({ current, previous }: { current: number; previous: number }) => {
  if (previous === 0 && current === 0) {
    return <span className="text-base-content/50 text-xs">—</span>;
  }
  const d = diff(current, previous);
  const positive = d >= 0;
  return (
    <span
      className={`text-xs font-semibold animate-pop-in ${
        positive ? "text-success" : "text-error"
      }`}
      style={{ animationDelay: "250ms" }}
    >
      {positive ? "▲" : "▼"} {formatPercent(Math.abs(d))}
    </span>
  );
};

const Card = ({
  title,
  current,
  previous,
  format = (n: number) => n.toLocaleString("es-CO"),
}: {
  title: string;
  current: number;
  previous: number;
  format?: (n: number) => string;
}) => (
  <div className="card bg-base-100 shadow transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
    <div className="card-body p-4">
      <p className="text-xs uppercase tracking-wide opacity-60">{title}</p>
      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-bold">{format(current)}</span>
        <Trend current={current} previous={previous} />
      </div>
      <p className="text-xs opacity-60">
        Período anterior: {format(previous)}
      </p>
    </div>
  </div>
);

export function PeriodComparison({ current, previous }: Props) {
  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">
        Comparativa con el período anterior
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card
          title="Citas"
          current={current.total}
          previous={previous.total}
        />
        <Card
          title="Finalizadas"
          current={current.finished}
          previous={previous.finished}
        />
        <Card
          title="Canceladas"
          current={current.cancelled}
          previous={previous.cancelled}
        />
        <Card
          title="Clientes únicos"
          current={current.uniqueCustomers}
          previous={previous.uniqueCustomers}
        />
        <Card
          title="Ingresos esperados"
          current={current.expectedRevenue}
          previous={previous.expectedRevenue}
          format={formatPrice}
        />
        <Card
          title="Ingresos confirmados"
          current={current.confirmedRevenue}
          previous={previous.confirmedRevenue}
          format={formatPrice}
        />
      </div>
    </section>
  );
}
