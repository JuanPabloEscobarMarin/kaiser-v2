import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError, inventoryApi } from "@/core/api";
import type { InventoryItem, InventoryCategory } from "@/core/api/inventory.api";
import { useNotify } from "@/ui/hooks/useNotify";
import { InventoryDesktopTable } from "./components/InventoryDesktopTable";
import { InventoryMobileList } from "./components/InventoryMobileList";
import { CreateItemDrawer } from "./components/CreateItemDrawer";
import { InventoryFabButton } from "./components/InventoryFabButton";
import { ListSkeleton } from "@/ui/components/Skeletons";

export function InventoryManager() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [catName, setCatName] = useState("");
  const notify = useNotify();

  const load = () => {
    setLoading(true);
    Promise.all([inventoryApi.listItems(), inventoryApi.listCategories()])
      .then(([items, cats]) => {
        setItems(items);
        setCategories(cats);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const isChecked = (id: string, e: ChangeEvent<HTMLInputElement>) => {
    setSelectedIds((curr) =>
      e.target.checked ? [...curr, id] : curr.filter((x) => x !== id),
    );
  };

  const handleViewDetails = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsViewMode(true);
    setIsDrawerOpen(true);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleEditSelected = () => {
    if (selectedIds.length !== 1) return;
    const item = items.find((i) => i.id === selectedIds[0]);
    if (!item) return;
    setSelectedItem(item);
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedItem(null);
      setIsViewMode(false);
    }, 300);
  };

  const handleDeletes = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`¿Eliminar ${ids.length} ítem(s) del inventario?`)) return;
    try {
      await Promise.all(ids.map((id) => inventoryApi.deleteItem(id)));
      notify.setMessage({ label: "Ítems eliminados", type: "success" });
      notify.notify();
      setSelectedIds([]);
      load();
    } catch (err) {
      notify.setMessage({
        label: err instanceof ApiError ? err.message : "Error",
        type: "error",
      });
      notify.notify();
    }
  };

  const addCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    try {
      await inventoryApi.createCategory({ name: catName.trim() });
      setCatName("");
      load();
    } catch {
      /* ignore duplicate */
    }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await inventoryApi.deleteCategory(id).catch(() => {});
    load();
  };

  const lowStock = items.filter(
    (i) => Number(i.minStock) > 0 && Number(i.quantity) <= Number(i.minStock),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventario</h1>
        <p className="text-sm opacity-70">{items.length} ítems registrados</p>
      </div>

      {lowStock.length > 0 && (
        <div className="alert alert-warning text-sm">
          <span>
            ⚠️ {lowStock.length} ítem(s) con stock bajo o agotado:{" "}
            {lowStock.map((i) => i.name).join(", ")}
          </span>
        </div>
      )}

      {/* Categorías */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="font-bold">Categorías</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div key={c.id} className="badge badge-outline gap-1">
                {c.name}
                <button
                  type="button"
                  className="ml-1 text-error text-xs"
                  onClick={() => deleteCategory(c.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <form onSubmit={addCategory} className="flex gap-2 mt-2">
            <input
              type="text"
              className="input input-bordered input-sm flex-1"
              placeholder="Nueva categoría"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-outline">
              Agregar
            </button>
          </form>
        </div>
      </div>

      {/* Ítems */}
      {loading ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <InventoryDesktopTable
            data={items}
            selectedIds={selectedIds}
            isChecked={isChecked}
            onViewDetails={handleViewDetails}
          />
          <InventoryMobileList
            items={items}
            selectedIds={selectedIds}
            isChecked={isChecked}
            onViewDetails={handleViewDetails}
          />
        </>
      )}

      <CreateItemDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        reload={load}
        item={selectedItem}
        categories={categories}
        readOnly={isViewMode}
      />

      <InventoryFabButton
        onAdd={handleAdd}
        onEdit={handleEditSelected}
        onDelete={() => handleDeletes(selectedIds)}
        disabledEdit={selectedIds.length !== 1}
        disabledDelete={selectedIds.length === 0}
        hidden={isDrawerOpen}
      />

      <div className="h-24" aria-hidden="true" />
    </div>
  );
}
