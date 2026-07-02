import { useEffect, useState } from "react";
import { ApiError, serviceCategoriesApi } from "@/core/api";
import type { ServiceCategory } from "@/core/types";
import { useNotify } from "@/ui/hooks/useNotify";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called after any change so the service list can re-fetch category names. */
  onChanged?: () => void;
}

export function CategoriesModal({ isOpen, onClose, onChanged }: Readonly<Props>) {
  const notify = useNotify();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () =>
    serviceCategoriesApi.list().then(setCategories).catch(() => setCategories([]));

  useEffect(() => {
    if (isOpen) {
      load();
      setNewName("");
    }
  }, [isOpen]);

  const fail = (err: unknown) => {
    notify.setMessage({
      label: err instanceof ApiError ? err.message : "Error",
      type: "error",
    });
    notify.notify();
  };

  const add = async () => {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    try {
      await serviceCategoriesApi.create({ name, order: categories.length });
      setNewName("");
      await load();
      onChanged?.();
    } catch (err) {
      fail(err);
    } finally {
      setBusy(false);
    }
  };

  const rename = async (c: ServiceCategory, name: string) => {
    try {
      await serviceCategoriesApi.update(c.id, { name });
      await load();
      onChanged?.();
    } catch (err) {
      fail(err);
    }
  };

  const remove = async (c: ServiceCategory) => {
    if (!confirm(`¿Eliminar la categoría "${c.name}"? Los servicios quedarán sin categoría.`)) {
      return;
    }
    try {
      await serviceCategoriesApi.remove(c.id);
      await load();
      onChanged?.();
    } catch (err) {
      fail(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="text-lg font-bold mb-3">Categorías de servicios</h3>

        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
          {categories.length === 0 && (
            <p className="text-sm opacity-60">Aún no hay categorías.</p>
          )}
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <input
                type="text"
                defaultValue={c.name}
                className="input input-bordered input-sm flex-1"
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v && v !== c.name) rename(c, v);
                }}
              />
              <button
                type="button"
                className="btn btn-sm btn-ghost text-error"
                onClick={() => remove(c)}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="divider my-3" />

        <div className="flex items-center gap-2">
          <input
            type="text"
            className="input input-bordered input-sm flex-1"
            placeholder="Nueva categoría (ej: Cortes)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
          />
          <button
            type="button"
            className="btn btn-sm btn-primary"
            onClick={add}
            disabled={busy || !newName.trim()}
          >
            Agregar
          </button>
        </div>

        <div className="modal-action">
          <button type="button" className="btn" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
