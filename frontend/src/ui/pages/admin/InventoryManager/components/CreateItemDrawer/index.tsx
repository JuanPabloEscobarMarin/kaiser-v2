import { useEffect, useState, type FormEvent } from "react";
import { ApiError, inventoryApi } from "@/core/api";
import type {
  CreateItemInput,
  InventoryCategory,
  InventoryItem,
} from "@/core/api/inventory.api";
import { useNotify } from "@/ui/hooks/useNotify";

const emptyForm: CreateItemInput = {
  name: "",
  description: "",
  quantity: "0",
  unit: "unidad",
  minStock: "0",
  cost: "0",
  categoryId: null,
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reload: () => void;
  item: InventoryItem | null;
  categories: InventoryCategory[];
  readOnly?: boolean;
}

export function CreateItemDrawer({
  isOpen,
  onClose,
  reload,
  item,
  categories,
  readOnly = false,
}: Props) {
  const [form, setForm] = useState<CreateItemInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const notify = useNotify();

  // Sync form whenever the target item changes (edit/view) or resets (create).
  useEffect(() => {
    if (item) {
      setForm({
        name: item.name,
        description: item.description ?? "",
        quantity: item.quantity,
        unit: item.unit,
        minStock: item.minStock,
        cost: item.cost,
        categoryId: item.categoryId,
      });
    } else {
      setForm(emptyForm);
    }
  }, [item]);

  const title = readOnly
    ? "Detalle del ítem"
    : item
      ? "Editar ítem"
      : "Nuevo ítem";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (item) {
        await inventoryApi.updateItem(item.id, form);
        notify.setMessage({ label: "Ítem actualizado", type: "success" });
      } else {
        await inventoryApi.createItem(form);
        notify.setMessage({ label: "Ítem creado", type: "success" });
      }
      notify.notify();
      onClose();
      reload();
    } catch (err) {
      notify.setMessage({
        label: err instanceof ApiError ? err.message : "Error",
        type: "error",
      });
      notify.notify();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`drawer drawer-end ${isOpen ? "" : "pointer-events-none"}`}>
      <input type="checkbox" className="drawer-toggle" checked={isOpen} readOnly />
      <div className="drawer-side z-50">
        <label className="drawer-overlay" onClick={onClose} />
        <div className="bg-base-100 min-h-full w-full md:w-120 flex flex-col shadow-2xl drawer-content-cascade">
          <div className="flex justify-between items-center p-6 border-b border-base-200">
            <h2 className="text-xl font-bold">{title}</h2>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
              ✕
            </button>
          </div>

          <form onSubmit={submit} className="p-6 flex-1 overflow-y-auto space-y-3">
            <fieldset>
              <legend className="text-sm font-medium mb-1">Nombre</legend>
              <input
                type="text"
                className="input input-bordered w-full"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                disabled={readOnly}
                required
              />
            </fieldset>

            <fieldset>
              <legend className="text-sm font-medium mb-1">Descripción</legend>
              <input
                type="text"
                className="input input-bordered w-full"
                value={form.description ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                disabled={readOnly}
              />
            </fieldset>

            <div className="grid grid-cols-2 gap-3">
              <fieldset>
                <legend className="text-sm font-medium mb-1">Cantidad</legend>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={form.quantity ?? "0"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, quantity: e.target.value }))
                  }
                  disabled={readOnly}
                  required
                />
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium mb-1">Unidad</legend>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={form.unit ?? "unidad"}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  disabled={readOnly}
                  required
                />
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium mb-1">Stock mínimo</legend>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={form.minStock ?? "0"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, minStock: e.target.value }))
                  }
                  disabled={readOnly}
                />
              </fieldset>
              <fieldset>
                <legend className="text-sm font-medium mb-1">Costo unitario</legend>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input input-bordered w-full"
                  value={form.cost ?? "0"}
                  onChange={(e) => setForm((f) => ({ ...f, cost: e.target.value }))}
                  disabled={readOnly}
                />
              </fieldset>
            </div>

            <fieldset>
              <legend className="text-sm font-medium mb-1">Categoría</legend>
              <select
                className="select select-bordered w-full"
                value={form.categoryId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, categoryId: e.target.value || null }))
                }
                disabled={readOnly}
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </fieldset>

            {!readOnly && (
              <div className="flex justify-end gap-2 pt-4 border-t border-base-200">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting && <span className="loading loading-spinner" />}
                  Guardar
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
