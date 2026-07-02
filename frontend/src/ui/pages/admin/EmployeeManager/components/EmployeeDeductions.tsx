import { useEffect, useState } from "react";
import { ApiError, deductionsApi } from "@/core/api";
import type { Deduction, DeductionType } from "@/core/api/deductions.api";
import { formatPrice } from "@/lib/format";
import { useNotify } from "@/ui/hooks/useNotify";

const TYPE_LABELS: Record<DeductionType, string> = {
  ADVANCE: "Adelanto/préstamo",
  PRODUCT: "Producto tomado",
  OTHER: "Otro",
};

export function EmployeeDeductions({ employeeId }: { employeeId: string }) {
  const notify = useNotify();
  const [items, setItems] = useState<Deduction[]>([]);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<DeductionType>("ADVANCE");
  const [note, setNote] = useState("");

  const load = () =>
    deductionsApi.list(employeeId).then(setItems).catch(() => setItems([]));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const total = items.reduce((s, d) => s + Number(d.amount), 0);

  const fail = (err: unknown) => {
    notify.setMessage({
      label: err instanceof ApiError ? err.message : "Error",
      type: "error",
    });
    notify.notify();
  };

  const add = async () => {
    if (!amount) return;
    try {
      await deductionsApi.create({
        employeeId,
        type,
        amount,
        note: note.trim() || null,
      });
      setAmount("");
      setNote("");
      load();
    } catch (err) {
      fail(err);
    }
  };

  const remove = async (id: string) => {
    try {
      await deductionsApi.remove(id);
      load();
    } catch (err) {
      fail(err);
    }
  };

  return (
    <fieldset className="border border-base-300 rounded-lg p-3">
      <legend className="font-semibold px-1">
        Deducciones (adelantos / productos)
      </legend>

      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto mb-2">
        {items.length === 0 && (
          <p className="text-sm opacity-60">Sin deducciones registradas.</p>
        )}
        {items.map((d) => (
          <div key={d.id} className="flex items-center gap-2 text-sm">
            <span className="badge badge-sm badge-ghost">
              {TYPE_LABELS[d.type]}
            </span>
            <span className="font-medium">{formatPrice(d.amount)}</span>
            <span className="opacity-60 flex-1 truncate">{d.note}</span>
            <span className="opacity-40 text-xs">
              {d.createdAt.slice(0, 10)}
            </span>
            <button
              type="button"
              className="btn btn-xs btn-ghost text-error"
              onClick={() => remove(d.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <p className="text-sm font-semibold mb-2">
          Total deducciones: {formatPrice(String(total))}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <select
          className="select select-bordered select-sm"
          value={type}
          onChange={(e) => setType(e.target.value as DeductionType)}
        >
          <option value="ADVANCE">Adelanto/préstamo</option>
          <option value="PRODUCT">Producto tomado</option>
          <option value="OTHER">Otro</option>
        </select>
        <input
          type="number"
          min="0"
          className="input input-bordered input-sm"
          placeholder="Monto"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <input
          type="text"
          className="input input-bordered input-sm flex-1"
          placeholder="Nota (opcional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button
          type="button"
          className="btn btn-sm btn-primary"
          onClick={add}
          disabled={!amount}
        >
          Agregar
        </button>
      </div>
    </fieldset>
  );
}
