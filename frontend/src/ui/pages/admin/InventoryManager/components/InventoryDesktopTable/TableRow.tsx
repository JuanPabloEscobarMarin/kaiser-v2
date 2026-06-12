import type { ChangeEvent } from "react";
import type { InventoryItem } from "@/core/api/inventory.api";

const formatCurrency = (v: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(v));

interface Props {
  item: InventoryItem;
  checked: boolean;
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (item: InventoryItem) => void;
}

export function TableRow({ item, checked, isChecked, onViewDetails }: Readonly<Props>) {
  const isLow =
    Number(item.minStock) > 0 && Number(item.quantity) <= Number(item.minStock);

  return (
    <tr
      className={`cursor-pointer hover:bg-base-200 ${isLow ? "bg-warning/10" : ""}`}
      onClick={() => onViewDetails(item)}
    >
      <td onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="checkbox"
          checked={checked}
          onChange={(e) => isChecked(item.id, e)}
          aria-label={`Seleccionar ${item.name}`}
        />
      </td>
      <td className="font-bold">{item.name}</td>
      <td>{item.category?.name ?? "—"}</td>
      <td>
        <span className={isLow ? "text-warning font-bold" : ""}>
          {item.quantity}
        </span>
      </td>
      <td>{item.unit}</td>
      <td>{item.minStock}</td>
      <td>{formatCurrency(item.cost)}</td>
      <td>
        <span className={`badge ${isLow ? "badge-warning" : "badge-success"}`}>
          {isLow ? "Stock bajo" : "OK"}
        </span>
      </td>
    </tr>
  );
}
