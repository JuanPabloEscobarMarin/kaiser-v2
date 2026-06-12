import type { ChangeEvent } from "react";
import type { Product } from "@/core/api/products.api";
import { ProductMobileImage } from "./ProductMobileImage";

const formatCurrency = (v: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(Number(v));

interface Props {
  products: Product[];
  selectedIds: string[];
  isChecked: (id: string, e: ChangeEvent<HTMLInputElement>) => void;
  onViewDetails: (product: Product) => void;
}

export function ProductMobileList({
  products,
  selectedIds,
  isChecked,
  onViewDetails,
}: Props) {
  if (products.length === 0) {
    return (
      <p className="md:hidden text-center opacity-60 py-6">
        Sin productos registrados
      </p>
    );
  }

  return (
    <ul className="md:hidden space-y-3 stagger-rows">
      {products.map((product) => (
        <li key={product.id}>
          <div
            className="card bg-base-100 shadow-sm cursor-pointer transition-all duration-200 active:scale-[0.99] hover:shadow-md"
            onClick={() => onViewDetails(product)}
          >
            <div className="flex justify-between items-center px-4 pt-4">
              <input
                type="checkbox"
                className="checkbox self-start"
                checked={selectedIds.includes(product.id)}
                aria-label={`Seleccionar ${product.name}`}
                onChange={(e) => isChecked(product.id, e)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className="flex items-center gap-2">
                <div
                  className={
                    product.state ? "status status-success" : "status status-error"
                  }
                />
                <span className="text-sm">
                  {formatCurrency(product.price)} · Stock: {product.stock}
                </span>
              </div>
            </div>
            <figure className="px-10 pt-4">
              <ProductMobileImage slug={product.urlImage} alt={product.name} />
            </figure>
            <div className="card-body items-center text-center">
              <h2 className="card-title">{product.name}</h2>
              <p className="text-sm opacity-80">{product.description}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
