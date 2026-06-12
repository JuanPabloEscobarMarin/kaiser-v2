import { useEffect, useState, type ChangeEvent } from "react";
import { ApiError, employeesApi, productsApi, salesApi } from "@/core/api";
import type { Sale } from "@/core/api/sales.api";
import type { Product } from "@/core/api/products.api";
import type { Employee } from "@/core/types";
import { useNotify } from "@/ui/hooks/useNotify";
import { SaleDesktopTable } from "./components/SaleDesktopTable";
import { SaleMobileList } from "./components/SaleMobileList";
import { CreateSaleDrawer } from "./components/CreateSaleDrawer";
import { SaleDetailDrawer } from "./components/SaleDetailDrawer";
import { SaleFabButton } from "./components/SaleFabButton";
import { formatCurrency } from "./utils";
import { ListSkeleton } from "@/ui/components/Skeletons";

export function SalesManager() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);
  const notify = useNotify();

  const load = () => {
    setLoading(true);
    Promise.all([salesApi.list(), productsApi.list(), employeesApi.list()])
      .then(([s, p, e]) => {
        setSales(s);
        setProducts(p);
        setEmployees(e.filter((emp) => emp.state));
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

  const handleDeletes = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`¿Anular ${ids.length} venta(s)? Se restaurará el stock.`)) return;
    try {
      await Promise.all(ids.map((id) => salesApi.remove(id)));
      notify.setMessage({ label: "Venta(s) anulada(s)", type: "success" });
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

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <>
      <div className="flex justify-between items-end flex-wrap gap-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Ventas</h1>
          <p className="text-sm opacity-70">{sales.length} venta(s) registradas</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-60">Total vendido</p>
          <p className="text-xl font-bold text-primary">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
      </div>

      {loading && sales.length === 0 && <ListSkeleton rows={4} />}

      <SaleDesktopTable
        data={sales}
        selectedIds={selectedIds}
        isChecked={isChecked}
        onViewDetails={setDetailSale}
      />

      <SaleMobileList
        sales={sales}
        selectedIds={selectedIds}
        isChecked={isChecked}
        onViewDetails={setDetailSale}
      />

      <CreateSaleDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        reload={load}
        products={products}
        employees={employees}
        onSubmit={(input) => salesApi.create(input)}
      />

      <SaleDetailDrawer
        isOpen={detailSale !== null}
        onClose={() => setDetailSale(null)}
        sale={detailSale}
      />

      <SaleFabButton
        onAdd={() => setIsCreateOpen(true)}
        onDelete={() => handleDeletes(selectedIds)}
        disabledDelete={selectedIds.length === 0}
        hidden={isCreateOpen || detailSale !== null}
      />

      <div className="h-24" aria-hidden="true" />
    </>
  );
}
