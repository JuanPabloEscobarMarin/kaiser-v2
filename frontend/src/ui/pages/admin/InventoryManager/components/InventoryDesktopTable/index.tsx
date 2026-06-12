import type { ChangeEvent } from "react";
import type { InventoryItem } from "@/core/api/inventory.api";
import { TableRow } from "./TableRow";

interface Props {
  data: InventoryItem[];
  selectedIds: string[];
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (item: InventoryItem) => void;
}

export function InventoryDesktopTable({
  data,
  selectedIds,
  isChecked,
  onViewDetails,
}: Readonly<Props>) {
  return (
    <div className="hidden md:block overflow-x-auto bg-base-100 rounded-box shadow">
      <table className="table table-zebra">
        <thead>
          <tr>
            <th></th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Cantidad</th>
            <th>Unidad</th>
            <th>Stock mínimo</th>
            <th>Costo unitario</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody className="stagger-rows">
          {data.map((item) => (
            <TableRow
              key={item.id}
              item={item}
              checked={selectedIds.includes(item.id)}
              isChecked={isChecked}
              onViewDetails={onViewDetails}
            />
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={8} className="text-center opacity-60 py-6">
                Sin ítems en inventario
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
