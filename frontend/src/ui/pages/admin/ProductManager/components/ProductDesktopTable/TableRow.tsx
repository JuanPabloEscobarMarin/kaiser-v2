import type { ChangeEvent } from "react";
import type { Product } from "@/core/api/products.api";
import placeholder from "@/assets/placeholder-image.webp";
import { resourcesApi } from "@/core/api";

const formatCurrency = (v: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(v));

interface Props {
  product: Product;
  checked: boolean;
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (product: Product) => void;
}

export function TableRow({ product, checked, isChecked, onViewDetails }: Readonly<Props>) {
  const imageUrl = resourcesApi.imageUrl(product.urlImage) ?? placeholder;

  return (
    <tr
      className="cursor-pointer hover:bg-base-200"
      onClick={() => onViewDetails(product)}
    >
      <td onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="checkbox"
          checked={checked}
          onChange={(e) => isChecked(product.id, e)}
          aria-label={`Seleccionar ${product.name}`}
        />
      </td>
      <td>
        <div className="flex items-center gap-3">
          <div className="avatar">
            <div className="mask mask-squircle h-12 w-12">
              <img
                src={imageUrl}
                onError={(e) => ((e.target as HTMLImageElement).src = placeholder)}
                alt={product.name}
              />
            </div>
          </div>
          <span className="font-bold">{product.name}</span>
        </div>
      </td>
      <td className="max-w-xs truncate" title={product.description ?? ""}>
        {product.description}
      </td>
      <td>{formatCurrency(product.price)}</td>
      <td>{product.stock}</td>
      <td>
        <span className={`badge ${product.state ? "badge-success" : "badge-error"}`}>
          {product.state ? "Activo" : "Inactivo"}
        </span>
      </td>
    </tr>
  );
}
