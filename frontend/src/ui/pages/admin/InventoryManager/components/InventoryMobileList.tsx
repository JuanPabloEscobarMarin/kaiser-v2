import type { ChangeEvent } from "react";
import type { InventoryItem } from "@/core/api/inventory.api";

const formatCurrency = (v: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(v));

interface Props {
  items: InventoryItem[];
  selectedIds: string[];
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (item: InventoryItem) => void;
}

export function InventoryMobileList({
  items,
  selectedIds,
  isChecked,
  onViewDetails,
}: Props) {
  if (items.length === 0) {
    return (
      <p className="md:hidden text-center opacity-60 py-6">
        Sin ítems en inventario
      </p>
    );
  }

  return (
    <ul className="md:hidden space-y-3 stagger-rows">
      {items.map((item) => {
        const isLow =
          Number(item.minStock) > 0 &&
          Number(item.quantity) <= Number(item.minStock);
        return (
          <li key={item.id}>
            <div
              className={`card bg-base-100 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.99] hover:shadow-md ${
                isLow ? "border border-warning" : ""
              }`}
              onClick={() => onViewDetails(item)}
            >
              <div className="card-body p-4 gap-2">
                <div className="flex justify-between items-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={selectedIds.includes(item.id)}
                    aria-label={`Seleccionar ${item.name}`}
                    onChange={(e) => isChecked(item.id, e)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span
                    className={`badge badge-sm ${
                      isLow ? "badge-warning" : "badge-success"
                    }`}
                  >
                    {isLow ? "Stock bajo" : "OK"}
                  </span>
                </div>
                <h3 className="font-bold">{item.name}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-80">
                  <span>{item.category?.name ?? "Sin categoría"}</span>
                  <span className={isLow ? "text-warning font-bold" : ""}>
                    {item.quantity} {item.unit}
                  </span>
                  <span>{formatCurrency(item.cost)}</span>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
