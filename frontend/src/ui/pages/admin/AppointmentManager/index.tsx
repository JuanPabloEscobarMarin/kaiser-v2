import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react";
import { ApiError, appointmentsApi, employeesApi } from "@/core/api";
import type { Appointment, Employee } from "@/core/types";
import { useNotify } from "@/ui/hooks/useNotify";
import { AppointmentDesktopTable } from "./components/AppointmentDesktopTable";
import { AppointmentMobileList } from "./components/AppointmentMobileList";
import { AppointmentFabButton } from "./components/AppointmentFabButton";
import { CreateAppointmentDrawer } from "./components/CreateAppointmentDrawer";
import { EditAppointmentDrawer } from "./components/EditAppointmentDrawer";
import { AppointmentCalendar } from "./components/AppointmentCalendar";
import { ListSkeleton } from "@/ui/components/Skeletons";

type Filter = "ALL" | Appointment["state"];

const FILTER_LABELS: Record<Filter, string> = {
  ALL: "Todas",
  SCHEDULED: "Agendadas",
  FINISHED: "Finalizadas",
  CANCELLED: "Canceladas",
};

const PAGE_SIZE = 10;

export function AppointmentManager() {
  const [list, setList] = useState<Appointment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] =
    useState<Appointment | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);

  const notify = useNotify();

  const load = () => {
    setLoading(true);
    Promise.all([appointmentsApi.list(), employeesApi.list()])
      .then(([apts, emps]) => {
        setList(apts);
        setEmployees(emps);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleViewDetails = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setIsViewMode(true);
    setEditOpen(true);
  };

  const handleEditSelected = () => {
    if (selectedIds.length !== 1) return;
    const appointment = list.find((a) => a.id === selectedIds[0]);
    if (!appointment) return;
    setEditingAppointment(appointment);
    setIsViewMode(false);
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setTimeout(() => {
      setEditingAppointment(null);
      setIsViewMode(false);
    }, 300);
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`¿Eliminar ${ids.length} cita(s)? Esta acción es permanente.`))
      return;
    try {
      await Promise.all(ids.map((id) => appointmentsApi.remove(id)));
      notify.setMessage({ label: "Citas eliminadas", type: "success" });
      notify.notify();
      setSelectedIds([]);
      load();
    } catch (err) {
      notify.setMessage({
        label: err instanceof ApiError ? err.message : "Error",
        type: "error",
      });
      notify.notify();
    }
  };

  const isChecked = (id: string, e: ChangeEvent<HTMLInputElement>) => {
    setSelectedIds((curr) =>
      e.target.checked ? [...curr, id] : curr.filter((x) => x !== id),
    );
  };

  const filtered = useMemo(
    () => (filter === "ALL" ? list : list.filter((a) => a.state === filter)),
    [list, filter],
  );

  // Reset to page 1 when filter changes
  useEffect(() => {
    setPage(1);
  }, [filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <>
      <div className="flex justify-between items-center flex-wrap gap-2 mb-4">
        <h1 className="text-2xl font-bold">Citas</h1>
        <div role="tablist" className="tabs tabs-boxed">
          {(Object.keys(FILTER_LABELS) as Filter[]).map((f) => (
            <button
              key={f}
              role="tab"
              className={`tab ${filter === f ? "tab-active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {loading && list.length === 0 && <ListSkeleton rows={4} />}

      {/* Calendar */}
      <div className="mb-6">
        <AppointmentCalendar
          appointments={filtered}
          employees={employees}
          onAppointmentClick={handleViewDetails}
        />
      </div>

      {/* Table */}
      <AppointmentDesktopTable
        data={pageItems}
        selectedIds={selectedIds}
        isChecked={isChecked}
        onViewDetails={handleViewDetails}
      />

      <AppointmentMobileList
        appointments={pageItems}
        selectedIds={selectedIds}
        isChecked={isChecked}
        onViewDetails={handleViewDetails}
      />

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 mt-4">
          <span className="text-sm opacity-70">
            Mostrando {pageStart + 1}–
            {Math.min(pageStart + PAGE_SIZE, filtered.length)} de{" "}
            {filtered.length}
          </span>
          <div className="join">
            <button
              className="join-item btn btn-sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
            >
              «
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (n) =>
                  n === 1 ||
                  n === totalPages ||
                  Math.abs(n - safePage) <= 1,
              )
              .map((n, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev !== undefined && n - prev > 1;
                return (
                  <span key={n} className="contents">
                    {showEllipsis && (
                      <button
                        className="join-item btn btn-sm btn-disabled"
                        disabled
                      >
                        …
                      </button>
                    )}
                    <button
                      className={`join-item btn btn-sm ${n === safePage ? "btn-active" : ""}`}
                      onClick={() => setPage(n)}
                    >
                      {n}
                    </button>
                  </span>
                );
              })}
            <button
              className="join-item btn btn-sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
            >
              »
            </button>
          </div>
        </div>
      )}

      <CreateAppointmentDrawer
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        reload={load}
      />

      <EditAppointmentDrawer
        isOpen={isEditOpen}
        onClose={handleCloseEdit}
        reload={load}
        appointment={editingAppointment}
        readOnly={isViewMode}
      />

      <AppointmentFabButton
        onAdd={() => setCreateOpen(true)}
        onEdit={handleEditSelected}
        onDelete={() => handleDelete(selectedIds)}
        disabledEdit={selectedIds.length !== 1}
        disabledDelete={selectedIds.length === 0}
        hidden={isCreateOpen || isEditOpen}
      />

      {/* Espacio para que el FAB no tape la paginación */}
      <div className="h-24" aria-hidden="true" />
    </>
  );
}
