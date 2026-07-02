import type { DailyClose } from "@/core/api/reports.api";
import { formatPrice } from "@/lib/format";

function Row({
  label,
  value,
  negative,
}: {
  label: string;
  value: number;
  negative?: boolean;
}) {
  return (
    <div className="flex justify-between">
      <span className="opacity-70">{label}</span>
      <span className={negative ? "text-error font-medium" : "font-medium"}>
        {negative && value !== 0 ? "− " : ""}
        {formatPrice(String(Math.abs(value)))}
      </span>
    </div>
  );
}

export function DailyCloseView({ data }: { data: DailyClose }) {
  return (
    <div className="space-y-3 text-sm">
      <div className="space-y-1">
        <Row label="Ingresos por servicios" value={data.serviceRevenue} />
        <Row label="Comisión de servicios" value={data.serviceCommission} />
        <Row label="Ventas de productos" value={data.productSales} />
        <Row label="Comisión de productos" value={data.productCommission} />
        <Row label="Deducciones" value={data.deductions.total} negative />
      </div>

      <div className="border-t border-base-300 pt-2 flex justify-between text-base font-bold">
        <span>Neto a pagar</span>
        <span className="text-primary">
          {formatPrice(String(data.netEarnings))}
        </span>
      </div>

      {data.appointments.length > 0 && (
        <details className="collapse collapse-arrow bg-base-200 rounded-lg">
          <summary className="collapse-title text-sm font-medium py-2 min-h-0">
            Citas finalizadas ({data.appointments.length})
          </summary>
          <div className="collapse-content text-xs space-y-1">
            {data.appointments.map((a) => (
              <div key={a.id} className="flex justify-between">
                <span className="opacity-70">
                  {a.customer ?? "—"} · {a.services.join(" + ")}
                </span>
                <span>{formatPrice(String(a.price))}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {data.deductions.items.length > 0 && (
        <details className="collapse collapse-arrow bg-base-200 rounded-lg">
          <summary className="collapse-title text-sm font-medium py-2 min-h-0">
            Deducciones ({data.deductions.items.length})
          </summary>
          <div className="collapse-content text-xs space-y-1">
            {data.deductions.items.map((d) => (
              <div key={d.id} className="flex justify-between">
                <span className="opacity-70">{d.note ?? d.type}</span>
                <span className="text-error">
                  − {formatPrice(String(d.amount))}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
