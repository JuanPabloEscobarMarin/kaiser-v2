import { useEffect, useState } from "react";
import { employeePortalApi } from "@/core/api";
import type { Sale } from "@/core/api/sales.api";
import type { Product } from "@/core/api/products.api";
import { CreateSaleDrawer } from "@/ui/pages/admin/SalesManager/components/CreateSaleDrawer";
import { SaleDetailDrawer } from "@/ui/pages/admin/SalesManager/components/SaleDetailDrawer";
import {
  formatCurrency,
  formatDateTime,
} from "@/ui/pages/admin/SalesManager/utils";
import { ListSkeleton } from "@/ui/components/Skeletons";

export function EmployeeSales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailSale, setDetailSale] = useState<Sale | null>(null);

  const load = () => {
    Promise.all([employeePortalApi.mySales(), employeePortalApi.products()])
      .then(([s, p]) => {
        setSales(s);
        setProducts(p);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const totalCommission = sales.reduce(
    (sum, s) => sum + Number(s.commissionTotal),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Mis ventas</h1>
          <p className="text-sm opacity-60">{sales.length} venta(s)</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs opacity-60">Comisión por ventas</p>
            <p className="text-lg font-bold text-success">
              {formatCurrency(totalCommission)}
            </p>
          </div>
          <button className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
            + Nueva venta
          </button>
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={5} />
      ) : (
        <div className="overflow-x-auto bg-base-100 rounded-box shadow">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Ítems</th>
                <th>Total</th>
                <th>Mi comisión</th>
              </tr>
            </thead>
            <tbody className="stagger-rows">
              {sales.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer hover:bg-base-200"
                  onClick={() => setDetailSale(s)}
                >
                  <td className="whitespace-nowrap">{formatDateTime(s.createdAt)}</td>
                  <td>{s.customer?.fullName ?? "—"}</td>
                  <td>{s.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td className="font-semibold">{formatCurrency(s.total)}</td>
                  <td className="text-success">
                    {Number(s.commissionTotal) > 0
                      ? formatCurrency(s.commissionTotal)
                      : "—"}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center opacity-60 py-6">
                    Aún no has registrado ventas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Carrito sin selector de vendedor: la venta queda a nombre del empleado */}
      <CreateSaleDrawer
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        reload={load}
        products={products}
        onSubmit={(input) => employeePortalApi.createSale(input)}
      />

      <SaleDetailDrawer
        isOpen={detailSale !== null}
        onClose={() => setDetailSale(null)}
        sale={detailSale}
      />
    </div>
  );
}
