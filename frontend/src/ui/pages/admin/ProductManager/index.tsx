import { useEffect, useState, type ChangeEvent } from "react";
import { ApiError, productsApi } from "@/core/api";
import type { Product } from "@/core/api/products.api";
import { useNotify } from "@/ui/hooks/useNotify";
import { ProductDesktopTable } from "./components/ProductDesktopTable";
import { ProductMobileList } from "./components/ProductMobileList";
import { CreateProductDrawer } from "./components/CreateProductDrawer";
import { ListSkeleton } from "@/ui/components/Skeletons";
import { FabActions } from "@/ui/components/FabActions";

export function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const notify = useNotify();

  const load = () => {
    productsApi
      .list()
      .then(setProducts)
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

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsViewMode(true);
    setIsDrawerOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleEditSelected = () => {
    if (selectedIds.length !== 1) return;
    const product = products.find((p) => p.id === selectedIds[0]);
    if (!product) return;
    setSelectedProduct(product);
    setIsViewMode(false);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => {
      setSelectedProduct(null);
      setIsViewMode(false);
    }, 300);
  };

  const handleDeletes = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`¿Eliminar ${ids.length} producto(s)?`)) return;
    try {
      await Promise.all(ids.map((id) => productsApi.remove(id)));
      notify.setMessage({ label: "Productos eliminados", type: "success" });
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

  return (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Productos</h1>
        <p className="text-sm opacity-70">{products.length} producto(s)</p>
      </div>

      {loading && products.length === 0 && <ListSkeleton rows={4} />}

      <ProductDesktopTable
        data={products}
        selectedIds={selectedIds}
        isChecked={isChecked}
        onViewDetails={handleViewDetails}
      />

      <ProductMobileList
        products={products}
        selectedIds={selectedIds}
        isChecked={isChecked}
        onViewDetails={handleViewDetails}
      />

      <CreateProductDrawer
        reload={load}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        product={selectedProduct}
        readOnly={isViewMode}
      />

      <FabActions
        onAdd={handleAdd}
        onEdit={handleEditSelected}
        onDelete={() => handleDeletes(selectedIds)}
        disabledEdit={selectedIds.length !== 1}
        disabledDelete={selectedIds.length === 0}
        hidden={isDrawerOpen}
      />

      <div className="h-24" aria-hidden="true" />
    </>
  );
}
