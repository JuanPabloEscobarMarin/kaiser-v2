import { useCallback, useEffect, useState } from "react";
import { ApiError, employeePortalApi } from "@/core/api";
import type { ScheduleBlock } from "@/core/types";
import { useNotify } from "@/ui/hooks/useNotify";

const DOW_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

type Mode = "date" | "weekly";

const describeBlock = (b: ScheduleBlock) => {
  const when =
    b.date != null
      ? new Date(`${b.date}T00:00:00.000Z`).toLocaleDateString("es-CO", {
          timeZone: "UTC",
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : `Cada ${DOW_LABELS[b.dayOfWeek ?? 0]}`;
  const range = b.isFullDay ? "Todo el día" : `${b.startTime} – ${b.endTime}`;
  return { when, range };
};

export function EmployeeTimeOff() {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const notify = useNotify();

  const [mode, setMode] = useState<Mode>("date");
  const [date, setDate] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    employeePortalApi
      .listBlocks()
      .then(setBlocks)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (mode === "date" && !date) {
      notify.setMessage({ label: "Selecciona una fecha", type: "error" });
      notify.notify();
      return;
    }
    if (!isFullDay && startTime >= endTime) {
      notify.setMessage({
        label: "La hora de fin debe ser mayor que la de inicio",
        type: "error",
      });
      notify.notify();
      return;
    }
    setBusy(true);
    try {
      await employeePortalApi.createBlock({
        date: mode === "date" ? date : null,
        dayOfWeek: mode === "weekly" ? dayOfWeek : null,
        isFullDay,
        // Backend requires start/end even for full-day blocks; send the day span.
        startTime: isFullDay ? "00:00" : startTime,
        endTime: isFullDay ? "23:59" : endTime,
        reason: reason.trim() || null,
      });
      notify.setMessage({ label: "Bloqueo creado", type: "success" });
      notify.notify();
      setReason("");
      setDate("");
      await load();
    } catch (err) {
      notify.setMessage({
        label: err instanceof ApiError ? err.message : "Error al crear bloqueo",
        type: "error",
      });
      notify.notify();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este bloqueo?")) return;
    try {
      await employeePortalApi.deleteBlock(id);
      setBlocks((bs) => bs.filter((b) => b.id !== id));
    } catch {
      notify.setMessage({ label: "No se pudo eliminar", type: "error" });
      notify.notify();
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Mi tiempo libre</h1>
        <p className="text-sm opacity-60">
          Bloquea días u horas en los que no estarás disponible. Esos espacios no
          aparecerán para que los clientes reserven.
        </p>
      </div>

      {/* Nuevo bloqueo */}
      <div className="card bg-base-100 shadow">
        <div className="card-body gap-3">
          <h2 className="font-bold text-lg">Nuevo bloqueo</h2>

          <div role="tablist" className="tabs tabs-boxed w-fit">
            <button
              role="tab"
              className={`tab ${mode === "date" ? "tab-active" : ""}`}
              onClick={() => setMode("date")}
            >
              Día puntual
            </button>
            <button
              role="tab"
              className={`tab ${mode === "weekly" ? "tab-active" : ""}`}
              onClick={() => setMode("weekly")}
            >
              Recurrente semanal
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {mode === "date" ? (
              <fieldset>
                <legend className="text-sm font-medium mb-1">Fecha</legend>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </fieldset>
            ) : (
              <fieldset>
                <legend className="text-sm font-medium mb-1">Día de la semana</legend>
                <select
                  className="select select-bordered w-full"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                >
                  {DOW_LABELS.map((label, i) => (
                    <option key={i} value={i}>
                      {label}
                    </option>
                  ))}
                </select>
              </fieldset>
            )}

            <fieldset>
              <legend className="text-sm font-medium mb-1">Motivo (opcional)</legend>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Vacaciones, cita médica…"
                maxLength={200}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </fieldset>
          </div>

          <label className="label cursor-pointer w-fit gap-2">
            <input
              type="checkbox"
              className="checkbox"
              checked={isFullDay}
              onChange={(e) => setIsFullDay(e.target.checked)}
            />
            <span className="label-text">Todo el día</span>
          </label>

          {!isFullDay && (
            <div className="grid sm:grid-cols-2 gap-3">
              <fieldset>
                <legend className="text-sm font-medium mb-1">Desde</legend>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium mb-1">Hasta</legend>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </fieldset>
            </div>
          )}

          <div>
            <button className="btn btn-primary" onClick={submit} disabled={busy}>
              {busy && <span className="loading loading-spinner loading-sm" />}
              Crear bloqueo
            </button>
          </div>
        </div>
      </div>

      {/* Bloqueos existentes */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="font-bold text-lg">Bloqueos activos</h2>
          {loading ? (
            <ul className="space-y-2" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <li key={i} className="py-2">
                  <div className="h-4 w-2/3 bg-base-300 rounded animate-pulse" />
                </li>
              ))}
            </ul>
          ) : blocks.length === 0 ? (
            <p className="text-sm opacity-60">No tienes bloqueos registrados.</p>
          ) : (
            <ul className="divide-y divide-base-300">
              {blocks.map((b) => {
                const { when, range } = describeBlock(b);
                return (
                  <li
                    key={b.id}
                    className="flex items-center justify-between py-3 gap-3"
                  >
                    <div>
                      <p className="font-medium capitalize">{when}</p>
                      <p className="text-xs opacity-60">
                        {range}
                        {b.reason ? ` · ${b.reason}` : ""}
                      </p>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm text-error"
                      onClick={() => remove(b.id)}
                    >
                      Eliminar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
