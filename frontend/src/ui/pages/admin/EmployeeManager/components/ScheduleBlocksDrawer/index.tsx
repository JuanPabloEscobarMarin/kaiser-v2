import { useState, useEffect, type FormEvent } from "react";
import { ApiError, employeeBlocksApi } from "@/core/api";
import type { EmployeeBlock, CreateBlockInput } from "@/core/api/employee-blocks.api";
import { dayName } from "@/core/api/employee-blocks.api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
}

const emptyForm: CreateBlockInput = {
  date: "",
  dayOfWeek: null,
  startTime: "09:00",
  endTime: "18:00",
  isFullDay: false,
  reason: "",
};

export function ScheduleBlocksDrawer({ isOpen, onClose, employeeId, employeeName }: Props) {
  const [blocks, setBlocks] = useState<EmployeeBlock[]>([]);
  const [form, setForm] = useState<CreateBlockInput>(emptyForm);
  const [blockType, setBlockType] = useState<"date" | "weekday">("date");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!isOpen) return;
    employeeBlocksApi.list(employeeId).then(setBlocks).catch(() => setBlocks([]));
  };

  useEffect(() => {
    load();
    setForm(emptyForm);
    setBlockType("date");
    setError(null);
  }, [isOpen, employeeId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: CreateBlockInput = {
        ...form,
        date: blockType === "date" ? form.date || null : null,
        dayOfWeek: blockType === "weekday" ? form.dayOfWeek : null,
      };
      await employeeBlocksApi.create(employeeId, payload);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al crear bloqueo");
    } finally {
      setLoading(false);
    }
  };

  const remove = async (blockId: string) => {
    try {
      await employeeBlocksApi.remove(employeeId, blockId);
      load();
    } catch {
      /* ignore */
    }
  };

  const formatBlock = (b: EmployeeBlock) => {
    const when =
      b.date != null
        ? new Date(`${b.date}T00:00:00.000Z`).toLocaleDateString("es-CO", {
            timeZone: "UTC",
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : `Cada ${dayName(b.dayOfWeek!)}`;
    const time = b.isFullDay ? "Todo el día" : `${b.startTime} – ${b.endTime}`;
    return `${when} · ${time}`;
  };

  return (
    <div className="drawer drawer-end absolute z-50">
      <input
        id="blocks-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        readOnly
      />
      <div className="drawer-side z-50">
        <label htmlFor="blocks-drawer" className="drawer-overlay" onClick={onClose} />
        <div className="bg-base-100 min-h-full w-full md:w-120 flex flex-col shadow-2xl drawer-content-cascade">
          <div className="flex justify-between items-center p-6 border-b border-base-200">
            <div>
              <h2 className="text-xl font-bold">Bloqueos de horario</h2>
              <p className="text-sm opacity-60">{employeeName}</p>
            </div>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>✕</button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            {error && <div className="alert alert-error text-sm">{error}</div>}

            {/* Form */}
            <form onSubmit={submit} className="space-y-3">
              <h3 className="font-semibold text-sm">Nuevo bloqueo</h3>

              <div className="flex gap-2">
                <button
                  type="button"
                  className={`btn btn-sm flex-1 ${blockType === "date" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setBlockType("date")}
                >
                  Fecha puntual
                </button>
                <button
                  type="button"
                  className={`btn btn-sm flex-1 ${blockType === "weekday" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setBlockType("weekday")}
                >
                  Día recurrente
                </button>
              </div>

              {blockType === "date" ? (
                <fieldset>
                  <legend className="text-sm font-medium mb-1">Fecha</legend>
                  <input
                    type="date"
                    className="input input-bordered w-full"
                    value={form.date ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    required
                  />
                </fieldset>
              ) : (
                <fieldset>
                  <legend className="text-sm font-medium mb-1">Día de la semana</legend>
                  <select
                    className="select select-bordered w-full"
                    value={form.dayOfWeek ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                    required
                  >
                    <option value="">— elige un día —</option>
                    {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                      <option key={d} value={d}>{dayName(d)}</option>
                    ))}
                  </select>
                </fieldset>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="toggle toggle-warning toggle-sm"
                  checked={!!form.isFullDay}
                  onChange={(e) => setForm((f) => ({ ...f, isFullDay: e.target.checked }))}
                />
                <span className="text-sm">Todo el día</span>
              </label>

              {!form.isFullDay && (
                <div className="flex items-center gap-2">
                  <fieldset className="flex-1">
                    <legend className="text-xs font-medium mb-1">Desde</legend>
                    <input
                      type="time"
                      className="input input-bordered input-sm w-full"
                      value={form.startTime}
                      onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                      required
                    />
                  </fieldset>
                  <span className="text-xs opacity-50 mt-4">a</span>
                  <fieldset className="flex-1">
                    <legend className="text-xs font-medium mb-1">Hasta</legend>
                    <input
                      type="time"
                      className="input input-bordered input-sm w-full"
                      value={form.endTime}
                      onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                      required
                    />
                  </fieldset>
                </div>
              )}

              <fieldset>
                <legend className="text-sm font-medium mb-1">Motivo (opcional)</legend>
                <input
                  type="text"
                  className="input input-bordered input-sm w-full"
                  placeholder="Vacaciones, cita médica..."
                  value={form.reason ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  maxLength={200}
                />
              </fieldset>

              <button type="submit" className="btn btn-warning btn-sm w-full" disabled={loading}>
                {loading && <span className="loading loading-spinner loading-xs" />}
                Agregar bloqueo
              </button>
            </form>

            <div className="divider" />

            {/* Existing blocks */}
            <div>
              <h3 className="font-semibold text-sm mb-2">Bloqueos activos ({blocks.length})</h3>
              {blocks.length === 0 ? (
                <p className="text-sm opacity-60">Sin bloqueos configurados</p>
              ) : (
                <ul className="space-y-2">
                  {blocks.map((b) => (
                    <li
                      key={b.id}
                      className="flex items-start justify-between p-3 rounded-box border border-base-300 text-sm"
                    >
                      <div>
                        <p className="font-medium">{formatBlock(b)}</p>
                        {b.reason && <p className="text-xs opacity-60">{b.reason}</p>}
                      </div>
                      <button
                        type="button"
                        className="btn btn-xs btn-ghost text-error ml-2"
                        onClick={() => remove(b.id)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
