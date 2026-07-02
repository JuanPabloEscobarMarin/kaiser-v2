import { useEffect, useState, type ChangeEvent } from "react";
import { ApiError, servicesApi } from "@/core/api";
import type { Service } from "@/core/types";
import { ServiceMobileList } from "./components/ServiceMobileList";
import { ServiceDesktopTable } from "./components/ServiceDesktopTable";
import { CreateServiceDrawer } from "./components/CreateServiceDrawer";
import { CategoriesModal } from "./components/CategoriesModal";
import { PackagesModal } from "./components/PackagesModal";
import { useNotify } from "@/ui/hooks/useNotify";
import { ListSkeleton } from "@/ui/components/Skeletons";
import { FabActions } from "@/ui/components/FabActions";

export function ServiceManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesIds, setServicesIds] = useState<string[]>([]);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [isPackagesOpen, setIsPackagesOpen] = useState(false);
  const notify = useNotify();

  const load = () => {
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
      <div className="flex justify-end gap-2 mb-3">
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => setIsPackagesOpen(true)}
        >
          Gestionar combos
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline"
          onClick={() => setIsCategoriesOpen(true)}
        >
          Gestionar categorías
        </button>
      </div>

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

      <CategoriesModal
        isOpen={isCategoriesOpen}
        onClose={() => setIsCategoriesOpen(false)}
        onChanged={load}
      />

      <PackagesModal
        isOpen={isPackagesOpen}
        onClose={() => setIsPackagesOpen(false)}
      />

      <FabActions
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
