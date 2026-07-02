import type { ChangeEvent } from "react";
import type { Product } from "@/core/api/products.api";
import { TableRow } from "./TableRow";

interface Props {
  data: Product[];
  selectedIds: string[];
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (product: Product) => void;
}

export function ProductDesktopTable({
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
            <th>Descripción</th>
            <th>Precio</th>
            <th>Utilidad</th>
            <th>Stock</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody className="stagger-rows">
          {data.map((product) => (
            <TableRow
              key={product.id}
              product={product}
              checked={selectedIds.includes(product.id)}
              isChecked={isChecked}
              onViewDetails={onViewDetails}
            />
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center opacity-60 py-6">
                Sin productos registrados
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
