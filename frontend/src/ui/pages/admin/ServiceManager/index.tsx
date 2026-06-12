import { useEffect, useState, type ChangeEvent } from "react";
import { ApiError, servicesApi } from "@/core/api";
import type { Service } from "@/core/types";
import { ServiceMobileList } from "./components/ServiceMobileList";
import { ServiceDesktopTable } from "./components/ServiceDesktopTable";
import { CreateServiceDrawer } from "./components/CreateServiceDrawer";
import { ServiceFabButton } from "./components/ServiceFabButton";
import { useNotify } from "@/ui/hooks/useNotify";
import { ListSkeleton } from "@/ui/components/Skeletons";

export function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesIds, setServicesIds] = useState<string[]>([]);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const notify = useNotify();

  const load = () => {
    setLoading(true);
    servicesApi
      .list()
      .then(setServices)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleViewDetails = (service: Service) => {
    setSelectedService(service);
    setIsViewMode(true);
    setIsCreateDrawerOpen(true);
  };

  const handleEditSelected = () => {
    if (servicesIds.length !== 1) return;
    const service = services.find((s) => s.id === servicesIds[0]);
    if (!service) return;
    setSelectedService(service);
    setIsViewMode(false);
    setIsCreateDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsCreateDrawerOpen(false);
    setTimeout(() => {
      setSelectedService(null);
      setIsViewMode(false);
    }, 300);
  };

  const handleDeletes = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`¿Eliminar ${ids.length} servicio(s)?`)) return;
    try {
      await servicesApi.removeMany(ids);
      notify.setMessage({ label: "Servicios eliminados", type: "success" });
      notify.notify();
      setServicesIds([]);
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
    setServicesIds((curr) =>
      e.target.checked ? [...curr, id] : curr.filter((x) => x !== id),
    );
  };

  return (
    <>
      {loading && services.length === 0 && <ListSkeleton rows={4} />}

      <ServiceDesktopTable
        data={services}
        selectedIds={servicesIds}
        isChecked={isChecked}
        onViewDetails={handleViewDetails}
      />

      <ServiceMobileList
        services={services}
        isChecked={isChecked}
        onViewDetails={handleViewDetails}
      />

      <CreateServiceDrawer
        reload={load}
        isOpen={isCreateDrawerOpen}
        onClose={handleCloseDrawer}
        service={selectedService}
        readOnly={isViewMode}
      />

      <ServiceFabButton
        onAdd={() => {
          setSelectedService(null);
          setIsViewMode(false);
          setIsCreateDrawerOpen(true);
        }}
        onEdit={handleEditSelected}
        onDelete={() => handleDeletes(servicesIds)}
        disabledEdit={servicesIds.length !== 1}
        disabledDelete={servicesIds.length === 0}
        hidden={isCreateDrawerOpen}
      />

      <div className="h-24" aria-hidden="true" />
    </>
  );
}
