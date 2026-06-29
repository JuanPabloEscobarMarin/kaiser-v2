import { useState, useEffect, type FormEvent } from "react";
import { ApiError, employeesApi, resourcesApi, servicesApi } from "@/core/api";
import type { Employee, Service } from "@/core/types";
import type { ServiceAssignment } from "@/core/api/employees.api";
import { useNotify } from "@/ui/hooks/useNotify";

interface Props {
  reload?: () => void;
  isOpen: boolean;
  onClose: () => void;
  employee?: Employee | null;
  readOnly?: boolean;
}

export function CreateEmployeeDrawer({
  reload,
  isOpen,
  onClose,
  employee,
  readOnly,
}: Readonly<Props>) {
  const { setMessage, notify } = useNotify();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [salary, setSalary] = useState("0");
  const [state, setState] = useState(true);
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    servicesApi.list().then(setServices).catch(() => setServices([]));
  }, []);

  useEffect(() => {
    if (employee) {
      setFullName(employee.fullName);
      setPhone(employee.phone);
      setSalary(employee.salary?.toString() || "0");
      setState(employee.state);
      setAssignments(
        employee.services?.map((s) => ({
          serviceId: s.id,
          commission: Number(s.commission ?? 0),
        })) ?? [],
      );
    } else {
      setFullName("");
      setPhone("");
      setSalary("0");
      setState(true);
      setAssignments([]);
    }
    setImage(null);
  }, [employee, isOpen]);

  const isSelected = (id: string) => assignments.some((a) => a.serviceId === id);

  const toggleService = (id: string) => {
    setAssignments((prev) => {
      if (prev.some((a) => a.serviceId === id)) {
        return prev.filter((a) => a.serviceId !== id);
      }
      return [...prev, { serviceId: id, commission: 0 }];
    });
  };

  const setCommission = (serviceId: string, value: number) => {
    setAssignments((prev) =>
      prev.map((a) => (a.serviceId === serviceId ? { ...a, commission: value } : a)),
    );
  };

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
        fullName,
        phone,
        salary,
        state,
        services: assignments,
        ...(urlImage ? { urlImage } : {}),
      };

      if (employee) {
        await employeesApi.update(employee.id, payload);
        setMessage({ label: "Empleado actualizado", type: "success" });
      } else {
        await employeesApi.create(payload);
        setMessage({ label: "Empleado creado", type: "success" });
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
        id="employee-drawer"
        type="checkbox"
        className="drawer-toggle"
        checked={isOpen}
        readOnly
      />

      <div className="drawer-side z-50">
        <label
          htmlFor="employee-drawer"
          className="drawer-overlay"
          onClick={onClose}
        />
        <div className="bg-base-100 min-h-full w-full md:w-150 flex flex-col shadow-2xl drawer-content-cascade">
          <div className="flex justify-between items-center p-6 border-b border-base-200">
            <h2 className="text-2xl font-bold">
              {readOnly
                ? "Detalles del empleado"
                : employee
                  ? "Editar empleado"
                  : "Nuevo empleado"}
            </h2>
            <button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <div className="p-6 flex-1 overflow-y-auto">
            <form onSubmit={submit} className="flex flex-col gap-4">
              <fieldset>
                <legend className="font-semibold mb-1">Nombre completo</legend>
                <input
                  type="text"
                  className="input w-full input-bordered"
                  placeholder="Ej: Carlos Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  readOnly={readOnly}
                  required
                />
              </fieldset>

              <fieldset>
                <legend className="font-semibold mb-1">Teléfono</legend>
                <input
                  type="tel"
                  className="input w-full input-bordered"
                  placeholder="Ej: 3001234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  readOnly={readOnly}
                  required
                />
              </fieldset>

              <fieldset>
                <legend className="font-semibold mb-1">Salario base</legend>
                <input
                  type="number"
                  className="input w-full input-bordered"
                  placeholder="0"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  readOnly={readOnly}
                  required
                />
              </fieldset>

              <fieldset>
                <legend className="font-semibold mb-1">Foto</legend>
                <div className="flex items-center gap-3">
                  {employee?.urlImage && (
                    <div className="avatar">
                      <div className="w-16 rounded-full">
                        <img
                          src={resourcesApi.imageUrl(employee.urlImage) ?? undefined}
                          alt={employee.fullName}
                        />
                      </div>
                    </div>
                  )}
                  {!readOnly && (
                    <input
                      type="file"
                      className="file-input file-input-bordered w-full"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files?.[0] ?? null)}
                    />
                  )}
                </div>
                {!readOnly && (
                  <small className="text-xs opacity-60">
                    Máx. 5MB. Deja vacío para conservar la actual.
                  </small>
                )}
              </fieldset>

              <fieldset>
                <legend className="font-semibold mb-2">Servicios y comisiones</legend>
                {services.length === 0 ? (
                  <p className="text-sm opacity-60">Cargando servicios...</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                    {services.filter((s) => s.state).map((svc) => {
                      const selected = isSelected(svc.id);
                      const assignment = assignments.find((a) => a.serviceId === svc.id);
                      return (
                        <div
                          key={svc.id}
                          className={`rounded-lg border transition ${
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-base-300"
                          } ${readOnly ? "pointer-events-none" : ""}`}
                        >
                          <label className="flex items-center gap-3 p-2 cursor-pointer">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-primary checkbox-sm"
                              checked={selected}
                              onChange={() => !readOnly && toggleService(svc.id)}
                              disabled={readOnly}
                            />
                            <span className="text-sm font-medium flex-1">{svc.name}</span>
                            <span className="text-xs opacity-50">{svc.duration} min</span>
                          </label>
                          {selected && (
                            <div className="px-3 pb-2 flex items-center gap-2">
                              <label className="text-xs opacity-70 whitespace-nowrap">
                                Comisión %
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.5"
                                className="input input-bordered input-xs w-20"
                                value={assignment?.commission ?? 0}
                                onChange={(e) =>
                                  setCommission(svc.id, Number(e.target.value))
                                }
                                readOnly={readOnly}
                              />
                              <span className="text-xs opacity-60">
                                = ${(
                                  (Number(svc.price) * (assignment?.commission ?? 0)) /
                                  100
                                ).toFixed(0)} por cita
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!readOnly && services.filter((s) => s.state).length > 0 && (
                  <p className="text-xs opacity-50 mt-1">
                    {assignments.length === 0
                      ? "Sin servicios asignados — no aparecerá en reservas"
                      : `${assignments.length} servicio${assignments.length > 1 ? "s" : ""} asignado${assignments.length > 1 ? "s" : ""}`}
                  </p>
                )}
              </fieldset>

              <label className="label cursor-pointer">
                <span className="font-medium">
                  Activo (visible para reservas)
                </span>
                <input
                  type="checkbox"
                  className="toggle toggle-success"
                  checked={state}
                  onChange={(e) => setState(e.target.checked)}
                  disabled={readOnly}
                />
              </label>

              <div className="flex justify-end gap-2 pt-4 border-t border-base-200">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={onClose}
                >
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
