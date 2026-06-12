import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { ApiError, resourcesApi, servicesApi } from "@/core/api";
import type { Service } from "@/core/types";
import { useNotify } from "@/ui/hooks/useNotify";

interface Props {
  reload?: () => void;
  isOpen: boolean;
  onClose: () => void;
  service?: Service | null;
  readOnly?: boolean;
}

export function CreateServiceDrawer({
  reload,
  isOpen,
  onClose,
  service,
  readOnly,
}: Readonly<Props>) {
  const { setMessage, notify } = useNotify();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState(0);
  const [discount, setDiscount] = useState("0");
  const [description, setDescription] = useState("");
  const [state, setState] = useState(true);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (service) {
      setName(service.name);
      setPrice(service.price.toString());
      setDuration(service.duration);
      setDiscount(service.discount?.toString() || "0");
      setDescription(service.description || "");
      setState(service.state);
    } else {
      setName("");
      setPrice("");
      setDuration(0);
      setDiscount("0");
      setDescription("");
      setState(true);
    }
    setImage(null);
  }, [service, isOpen]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (readOnly) return;
    setLoading(true);

    try {
      let urlImage: string | undefined;
      if (image) {
        const uploaded = await resourcesApi.upload(image);
        urlImage = uploaded.slug;
      }

      const payload = {
        name,
        price,
        duration,
        state,
        discount,
        description,
        ...(urlImage ? { urlImage } : {}),
      };

      if (service) {
        await servicesApi.update(service.id, payload);
        setMessage({ label: "Servicio actualizado", type: "success" });
      } else {
        await servicesApi.create(payload);
        setMessage({ label: "Servicio creado", type: "success" });
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

  return (
    <div className="drawer drawer-end absolute z-50">
      <input
        id="service-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        readOnly
      />

      <div className="drawer-side z-50">
        <label
          htmlFor="service-drawer"
          className="drawer-overlay"
          onClick={onClose}
        />
        <div className="bg-base-100 min-h-full w-full md:w-150 flex flex-col shadow-2xl drawer-content-cascade">
          <div className="flex justify-between items-center p-6 border-b border-base-200">
            <h2 className="text-2xl font-bold">
              {readOnly
                ? "Detalles del servicio"
                : service
                  ? "Editar servicio"
                  : "Nuevo servicio"}
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
                    className="input w-full input-bordered"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    readOnly={readOnly}
                    required
                  />
                </fieldset>
                <fieldset>
                  <legend className="font-semibold mb-1">Duración (min)</legend>
                  <input
                    type="number"
                    className="input w-full input-bordered"
                    value={duration === 0 ? "" : String(duration)}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setDuration(Number(e.target.value))
                    }
                    readOnly={readOnly}
                    required
                  />
                </fieldset>
              </div>

              <fieldset>
                <legend className="font-semibold mb-1">Descuento</legend>
                <input
                  type="number"
                  className="input w-full input-bordered"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  readOnly={readOnly}
                />
              </fieldset>

              <fieldset>
                <legend className="font-semibold mb-1">Descripción</legend>
                <textarea
                  className="textarea textarea-bordered w-full"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  readOnly={readOnly}
                />
              </fieldset>

              <fieldset>
                <legend className="font-semibold mb-1">Imagen</legend>
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
                <span className="font-medium">Activo (visible para clientes)</span>
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
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
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
