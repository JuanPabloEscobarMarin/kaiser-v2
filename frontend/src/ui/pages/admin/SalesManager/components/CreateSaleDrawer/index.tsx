import { useEffect, useMemo, useState } from "react";
import { ApiError } from "@/core/api";
import type { CreateSaleInput, Sale } from "@/core/api/sales.api";
import type { Product } from "@/core/api/products.api";
import type { Employee } from "@/core/types";
import { useNotify } from "@/ui/hooks/useNotify";
import { formatCurrency } from "../../utils";

interface Line {
  productId: string;
  quantity: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reload: () => void;
  products: Product[];
  /** Seller options. When provided → admin mode (shows seller select). */
  employees?: Employee[];
  onSubmit: (input: CreateSaleInput) => Promise<{ data: Sale } | unknown>;
}

export function CreateSaleDrawer({
  isOpen,
  onClose,
  reload,
  products,
  employees,
  onSubmit,
}: Props) {
  const notify = useNotify();
  const isAdmin = employees !== undefined;

  const [lines, setLines] = useState<Line[]>([]);
  const [pickProductId, setPickProductId] = useState("");
  const [employeeId, setEmployeeId] = useState(""); // "" = Administrador (sin comisión)
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  // Sellable products: active and with available stock not yet fully in cart.
  const sellable = useMemo(
    () => products.filter((p) => p.state && p.stock > 0),
    [products],
  );

  useEffect(() => {
    if (!isOpen) {
      setLines([]);
      setPickProductId("");
      setEmployeeId("");
      setCustName("");
      setCustPhone("");
      setCustEmail("");
    }
  }, [isOpen]);

  const addLine = () => {
    if (!pickProductId) return;
    setLines((curr) => {
      const existing = curr.find((l) => l.productId === pickProductId);
      const product = productMap.get(pickProductId);
      const max = product?.stock ?? 1;
      if (existing) {
        return curr.map((l) =>
          l.productId === pickProductId
            ? { ...l, quantity: Math.min(l.quantity + 1, max) }
            : l,
        );
      }
      return [...curr, { productId: pickProductId, quantity: 1 }];
    });
    setPickProductId("");
  };

  const setQty = (productId: string, qty: number) => {
    const max = productMap.get(productId)?.stock ?? 1;
    const clamped = Math.max(1, Math.min(qty, max));
    setLines((curr) =>
      curr.map((l) => (l.productId === productId ? { ...l, quantity: clamped } : l)),
    );
  };

  const removeLine = (productId: string) =>
    setLines((curr) => curr.filter((l) => l.productId !== productId));

  // A seller earns commission: admin with an employee chosen, or employee portal.
  const hasSeller = isAdmin ? employeeId !== "" : true;

  const { total, commission } = useMemo(() => {
    let total = 0;
    let commission = 0;
    for (const l of lines) {
      const p = productMap.get(l.productId);
      if (!p) continue;
      const sub = Number(p.price) * l.quantity;
      total += sub;
      if (hasSeller) commission += (sub * Number(p.commission)) / 100;
    }
    return { total, commission };
  }, [lines, productMap, hasSeller]);

  const anyCustomerField =
    custName.trim() || custPhone.trim() || custEmail.trim();
  const customerComplete =
    custName.trim().length >= 2 &&
    custPhone.trim().length >= 7;

  const submit = async () => {
    if (lines.length === 0) {
      notify.setMessage({ label: "Agrega al menos un producto", type: "error" });
      notify.notify();
      return;
    }
    if (anyCustomerField && !customerComplete) {
      notify.setMessage({
        label: "Completa los datos del cliente o déjalos vacíos",
        type: "error",
      });
      notify.notify();
      return;
    }
    setSubmitting(true);
    try {
      const payload: CreateSaleInput = {
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      };
      if (anyCustomerField) {
        payload.customer = {
          fullName: custName.trim(),
          phone: custPhone.trim(),
          ...(custEmail.trim() ? { email: custEmail.trim() } : {}),
        };
      }
      if (isAdmin) payload.employeeId = employeeId || null;

      await onSubmit(payload);
      notify.setMessage({ label: "Venta registrada", type: "success" });
      notify.notify();
      onClose();
      reload();
    } catch (err) {
      notify.setMessage({
        label: err instanceof ApiError ? err.message : "Error al registrar la venta",
        type: "error",
      });
      notify.notify();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`drawer drawer-end ${isOpen ? "" : "pointer-events-none"}`}>
      <input type="checkbox" className="drawer-toggle" checked={isOpen} readOnly />
      <div className="drawer-side z-50">
        <label className="drawer-overlay" onClick={onClose} />
        <div className="bg-base-100 min-h-full w-full md:w-150 flex flex-col shadow-2xl drawer-content-cascade">
          <div className="flex justify-between items-center p-6 border-b border-base-200">
            <h2 className="text-2xl font-bold">Nueva venta</h2>
            <button className="btn btn-sm btn-circle btn-ghost" onClick={onClose}>
              ✕
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            {/* Agregar productos */}
            <div>
              <h3 className="font-semibold mb-2">Productos</h3>
              <div className="flex gap-2">
                <select
                  className="select select-bordered flex-1"
                  value={pickProductId}
                  onChange={(e) => setPickProductId(e.target.value)}
                >
                  <option value="">Selecciona un producto…</option>
                  {sellable.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.price)} (stock {p.stock})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={addLine}
                  disabled={!pickProductId}
                >
                  Agregar
                </button>
              </div>

              {lines.length === 0 ? (
                <p className="text-sm opacity-60 mt-3">
                  Aún no has agregado productos.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {lines.map((l) => {
                    const p = productMap.get(l.productId);
                    if (!p) return null;
                    return (
                      <li
                        key={l.productId}
                        className="flex items-center gap-2 rounded-box border border-base-300 p-2"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs opacity-60">
                            {formatCurrency(p.price)} c/u
                          </p>
                        </div>
                        <input
                          type="number"
                          min={1}
                          max={p.stock}
                          className="input input-bordered input-sm w-20"
                          value={l.quantity}
                          onChange={(e) => setQty(l.productId, Number(e.target.value))}
                        />
                        <span className="w-24 text-right font-semibold">
                          {formatCurrency(Number(p.price) * l.quantity)}
                        </span>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm text-error"
                          onClick={() => removeLine(l.productId)}
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Vendedor (solo admin) */}
            {isAdmin && (
              <fieldset>
                <legend className="font-semibold mb-1">Vendedor</legend>
                <select
                  className="select select-bordered w-full"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                >
                  <option value="">Administrador (sin comisión)</option>
                  {employees!.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.fullName}
                    </option>
                  ))}
                </select>
                <small className="text-xs opacity-60">
                  Si eliges un empleado, recibirá la comisión de los productos.
                </small>
              </fieldset>
            )}

            {/* Cliente (opcional) */}
            <div>
              <h3 className="font-semibold mb-1">Cliente (opcional)</h3>
              <div className="grid sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Nombre"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                />
                <input
                  type="tel"
                  className="input input-bordered"
                  placeholder="Teléfono"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                />
                <input
                  type="email"
                  className="input input-bordered"
                  placeholder="Correo (opcional)"
                  value={custEmail}
                  onChange={(e) => setCustEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Totales */}
            <div className="border-t border-base-200 pt-3 space-y-1">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
              {hasSeller && commission > 0 && (
                <div className="flex justify-between text-success text-sm">
                  <span>Comisión del vendedor</span>
                  <span>{formatCurrency(commission)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 p-6 border-t border-base-200">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={submit}
              disabled={submitting || lines.length === 0}
            >
              {submitting && <span className="loading loading-spinner" />}
              Registrar venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
