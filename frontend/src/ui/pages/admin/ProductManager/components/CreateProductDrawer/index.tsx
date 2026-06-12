import { useState, useEffect, type FormEvent } from "react";
import { ApiError, resourcesApi, productsApi } from "@/core/api";
import type { Product, ProductInput } from "@/core/api/products.api";
import { useNotify } from "@/ui/hooks/useNotify";

interface Props {
  reload?: () => void;
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  readOnly?: boolean;
}

export function CreateProductDrawer({
  reload,
  isOpen,
  onClose,
  product,
  readOnly,
}: Readonly<Props>) {
  const { setMessage, notify } = useNotify();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState(0);
  const [commission, setCommission] = useState("0");
  const [description, setDescription] = useState("");
  const [state, setState] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(product.price.toString());
      setStock(product.stock);
      setCommission(product.commission?.toString() ?? "0");
      setDescription(product.description ?? "");
      setState(product.state);
      setCurrentSlug(product.urlImage);
    } else {
      setName("");
      setPrice("");
      setStock(0);
      setCommission("0");
      setDescription("");
      setState(true);
      setCurrentSlug(null);
    }
    setImage(null);
  }, [product, isOpen]);

  // Local preview when a new file is picked
  useEffect(() => {
    if (!image) {
      setImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (readOnly) return;
    setLoading(true);
    try {
      const payload: ProductInput = {
        name,
        price,
        stock,
        commission,
        description,
        state,
      };
      if (image) {
        const uploaded = await resourcesApi.upload(image);
        payload.urlImage = uploaded.slug;
      }
      if (product) {
        await productsApi.update(product.id, payload);
        setMessage({ label: "Producto actualizado", type: "success" });
      } else {
        await productsApi.create(payload);
        setMessage({ label: "Producto creado", type: "success" });
      }
      notify();
      reload?.();
      onClose();
    } catch (err) {
      setMessage({
        label: err instanceof ApiError ? err.message : "Error",
        type: "error",
      });
      notify();
    } finally {
      setLoading(false);
    }
  };

  const currentImageUrl =
    imagePreview ?? (currentSlug ? resourcesApi.imageUrl(currentSlug) : null);

  return (
    <div className="drawer drawer-end absolute z-50">
      <input
        id="product-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        readOnly
      />
      <div className="drawer-side z-50">
        <label
          htmlFor="product-drawer"
          className="drawer-overlay"
          onClick={onClose}
        />
        <div className="bg-base-100 min-h-full w-full md:w-150 flex flex-col shadow-2xl drawer-content-cascade">
          <div className="flex justify-between items-center p-6 border-b border-base-200">
            <h2 className="text-2xl font-bold">
              {readOnly
                ? "Detalles del producto"
                : product
                  ? "Editar producto"
                  : "Nuevo producto"}
            </h2>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <form onSubmit={submit} className="flex flex-col gap-4">
              <fieldset>
                <legend className="font-semibold mb-1">Nombre</legend>
                <input
                  type="text"
                  className="input w-full input-bordered"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={readOnly}
                  required
                />
              </fieldset>

              <div className="grid grid-cols-2 gap-3">
                <fieldset>
                  <legend className="font-semibold mb-1">Precio</legend>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="input w-full input-bordered"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    readOnly={readOnly}
                    required
                  />
                </fieldset>
                <fieldset>
                  <legend className="font-semibold mb-1">Stock</legend>
                  <input
                    type="number"
                    min="0"
                    className="input w-full input-bordered"
                    value={stock === 0 ? "" : String(stock)}
                    onChange={(e) => setStock(Number(e.target.value))}
                    readOnly={readOnly}
                  />
                </fieldset>
              </div>

              <fieldset>
                <legend className="font-semibold mb-1">
                  % Comisión por venta
                </legend>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="input w-full input-bordered"
                  value={commission}
                  onChange={(e) => setCommission(e.target.value)}
                  readOnly={readOnly}
                />
                <small className="text-xs opacity-60">
                  Porcentaje que gana el empleado que venda este producto.
                </small>
              </fieldset>

              <fieldset>
                <legend className="font-semibold mb-1">Descripción</legend>
                <textarea
                  className="textarea textarea-bordered w-full"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  readOnly={readOnly}
                />
              </fieldset>

              <fieldset>
                <legend className="font-semibold mb-1">Imagen</legend>
                {currentImageUrl && (
                  <img
                    src={currentImageUrl}
                    alt="Vista previa"
                    className="w-full aspect-video object-cover rounded mb-2"
                  />
                )}
                <input
                  type="file"
                  className="file-input file-input-bordered w-full"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                  disabled={readOnly}
                />
                <small className="text-xs opacity-60">Máx. 5MB</small>
              </fieldset>

              <label className="label cursor-pointer">
                <span className="font-medium">Activo (visible)</span>
                <input
                  type="checkbox"
                  className="toggle toggle-success"
                  checked={state}
                  onChange={(e) => setState(e.target.checked)}
                  disabled={readOnly}
                />
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-base-200">
                <button type="button" className="btn btn-ghost" onClick={onClose}>
                  {readOnly ? "Cerrar" : "Cancelar"}
                </button>
                {!readOnly && (
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading && <span className="loading loading-spinner" />}
                    Guardar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
