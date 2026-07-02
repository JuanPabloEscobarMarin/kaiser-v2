import { useEffect, useMemo, useState } from "react";
import { ApiError, servicePackagesApi, servicesApi } from "@/core/api";
import type { Service, ServicePackage } from "@/core/types";
import { useNotify } from "@/ui/hooks/useNotify";
import { formatPrice } from "@/lib/format";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function PackagesModal({ isOpen, onClose }: Readonly<Props>) {
  const notify = useNotify();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () =>
    servicePackagesApi.list().then(setPackages).catch(() => setPackages([]));

  useEffect(() => {
    if (!isOpen) return;
    load();
    servicesApi.list().then(setServices).catch(() => setServices([]));
    resetForm();
  }, [isOpen]);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setDescription("");
    setServiceIds([]);
  };

  const fail = (err: unknown) => {
    notify.setMessage({
      label: err instanceof ApiError ? err.message : "Error",
      type: "error",
    });
    notify.notify();
  };

  const suggested = useMemo(() => {
    const map = new Map(services.map((s) => [s.id, Number(s.price)]));
    return serviceIds.reduce((sum, id) => sum + (map.get(id) ?? 0), 0);
  }, [serviceIds, services]);

  const toggle = (id: string) =>
    setServiceIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );

  const startEdit = (p: ServicePackage) => {
    setEditingId(p.id);
    setName(p.name);
    setPrice(p.price.toString());
    setDescription(p.description ?? "");
    setServiceIds(p.items.map((i) => i.serviceId));
  };

  const save = async () => {
    if (!name.trim() || !price || serviceIds.length === 0) {
      notify.setMessage({
        label: "Nombre, precio y al menos un servicio son obligatorios",
        type: "warning",
      });
      notify.notify();
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: name.trim(),
        price,
        description: description.trim() || null,
        serviceIds,
      };
      if (editingId) {
        await servicePackagesApi.update(editingId, payload);
      } else {
        await servicePackagesApi.create(payload);
      }
      await load();
      resetForm();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p: ServicePackage) => {
    if (!confirm(`¿Eliminar el combo "${p.name}"?`)) return;
    try {
      await servicePackagesApi.remove(p.id);
      await load();
      if (editingId === p.id) resetForm();
    } catch (err) {
      fail(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="text-lg font-bold mb-3">Combos de servicios</h3>

        {/* Lista de combos */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 mb-4">
          {packages.length === 0 && (
            <p className="text-sm opacity-60">Aún no hay combos.</p>
          )}
          {packages.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 border border-base-300 rounded-lg p-2"
            >
              <div className="flex-1">
                <div className="font-semibold text-sm">
                  {p.name}{" "}
                  <span className="badge badge-sm badge-ghost">
                    {formatPrice(p.price)}
                  </span>
                </div>
                <div className="text-xs opacity-60">
                  {p.items.map((i) => i.service?.name).filter(Boolean).join(" + ")}
                </div>
              </div>
              <button
                type="button"
                className="btn btn-xs btn-outline"
                onClick={() => startEdit(p)}
              >
                Editar
              </button>
              <button
                type="button"
                className="btn btn-xs btn-ghost text-error"
                onClick={() => remove(p)}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="divider my-2">
          {editingId ? "Editar combo" : "Nuevo combo"}
        </div>

        {/* Formulario */}
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            className="input input-bordered input-sm"
            placeholder="Nombre (ej: Corte + Barba)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="number"
            min="0"
            className="input input-bordered input-sm"
            placeholder="Precio del combo"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <input
          type="text"
          className="input input-bordered input-sm w-full mt-2"
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <p className="text-sm font-medium mt-3 mb-1">Servicios incluidos</p>
        <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
          {services
            .filter((s) => s.state)
            .map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={serviceIds.includes(s.id)}
                  onChange={() => toggle(s.id)}
                />
                <span className="flex-1">{s.name}</span>
                <span className="opacity-50 text-xs">{formatPrice(s.price)}</span>
              </label>
            ))}
        </div>
        {serviceIds.length > 0 && (
          <p className="text-xs opacity-60 mt-1">
            Suma individual: {formatPrice(String(suggested))} — define el precio
            del combo (normalmente con descuento).
          </p>
        )}

        <div className="modal-action">
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancelar edición
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary"
            onClick={save}
            disabled={busy}
          >
            {editingId ? "Guardar cambios" : "Crear combo"}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
