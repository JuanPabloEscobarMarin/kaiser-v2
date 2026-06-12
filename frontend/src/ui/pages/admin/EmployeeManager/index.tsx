import { useEffect, useState, type ChangeEvent } from "react";
import { ApiError, employeesApi } from "@/core/api";
import type { Employee } from "@/core/types";
import { EmployeeDesktopTable } from "./components/EmployeeDesktopTable";
import { EmployeeMobileList } from "./components/EmployeeMobileList";
import { CreateEmployeeDrawer } from "./components/CreateEmployeeDrawer";
import { ScheduleBlocksDrawer } from "./components/ScheduleBlocksDrawer";
import { CreateAccountModal } from "./components/CreateAccountModal";
import { useNotify } from "@/ui/hooks/useNotify";
import { ListSkeleton } from "@/ui/components/Skeletons";
import { FabActions } from "@/ui/components/FabActions";

export function EmployeeManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [employeeIds, setEmployeeIds] = useState<string[]>([]);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [isViewMode, setIsViewMode] = useState(false);
  const [blocksEmployee, setBlocksEmployee] = useState<Employee | null>(null);
  const [accountEmployee, setAccountEmployee] = useState<Employee | null>(null);
  const notify = useNotify();

  const load = () => {
    employeesApi
      .list()
      .then(setEmployees)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsViewMode(true);
    setIsCreateDrawerOpen(true);
  };

  const handleEditSelected = () => {
    if (employeeIds.length !== 1) return;
    const employee = employees.find((e) => e.id === employeeIds[0]);
    if (!employee) return;
    setSelectedEmployee(employee);
    setIsViewMode(false);
    setIsCreateDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsCreateDrawerOpen(false);
    setTimeout(() => {
      setSelectedEmployee(null);
      setIsViewMode(false);
    }, 300);
  };

  const handleDeletes = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`¿Desactivar ${ids.length} empleado(s)?`)) return;
    try {
      await Promise.all(ids.map((id) => employeesApi.remove(id)));
      notify.setMessage({ label: "Empleados desactivados", type: "success" });
      notify.notify();
      setEmployeeIds([]);
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
    setEmployeeIds((curr) =>
      e.target.checked ? [...curr, id] : curr.filter((x) => x !== id),
    );
  };

  return (
    <>
      {loading && employees.length === 0 && <ListSkeleton rows={4} />}

      <EmployeeDesktopTable
        data={employees}
        selectedIds={employeeIds}
        isChecked={isChecked}
        onViewDetails={handleViewDetails}
        onManageBlocks={(emp) => setBlocksEmployee(emp)}
        onManageAccount={(emp) => setAccountEmployee(emp)}
      />

      <EmployeeMobileList
        employees={employees}
        isChecked={isChecked}
        onViewDetails={handleViewDetails}
      />

      <CreateEmployeeDrawer
        reload={load}
        isOpen={isCreateDrawerOpen}
        onClose={handleCloseDrawer}
        employee={selectedEmployee}
        readOnly={isViewMode}
      />

      <FabActions
        onAdd={() => {
          setSelectedEmployee(null);
          setIsViewMode(false);
          setIsCreateDrawerOpen(true);
        }}
        onEdit={handleEditSelected}
        onDelete={() => handleDeletes(employeeIds)}
        disabledEdit={employeeIds.length !== 1}
        disabledDelete={employeeIds.length === 0}
        hidden={isCreateDrawerOpen}
      />

      <ScheduleBlocksDrawer
        isOpen={blocksEmployee != null}
        onClose={() => setBlocksEmployee(null)}
        employeeId={blocksEmployee?.id ?? ""}
        employeeName={blocksEmployee?.fullName ?? ""}
      />

      <CreateAccountModal
        isOpen={accountEmployee != null}
        onClose={() => setAccountEmployee(null)}
        employeeId={accountEmployee?.id ?? ""}
        employeeName={accountEmployee?.fullName ?? ""}
        hasAccount={!!accountEmployee?.userId}
        onSuccess={load}
      />

      <div className="h-24" aria-hidden="true" />
    </>
  );
}
