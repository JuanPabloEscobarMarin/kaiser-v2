import { ServicePackageRepository } from "../repositories/service-package.repository.ts";
import { BadRequestException, NotFoundException } from "../exceptions/HttpException.ts";
import type {
  CreatePackageInput,
  UpdatePackageInput,
} from "../validators/service-package.validators.ts";

export const ServicePackageService = {
  list: (includeInactive = false) =>
    ServicePackageRepository.all(includeInactive),

  async getById(id: string) {
    // Validación: Verificar que el ID del combo no sea nulo, vacío ni consista solo de espacios.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID del combo es obligatorio");
    }

    const pkg = await ServicePackageRepository.byId(id.trim());
    if (!pkg) throw new NotFoundException("Combo no encontrado");
    return pkg;
  },
  async create(data: CreatePackageInput) {
    // Validación: El nombre del combo es obligatorio y no puede consistir únicamente en espacios.
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException("El nombre del combo es obligatorio");
    }

    // Validación: Longitud mínima del nombre del combo para evitar registros ambiguos.
    if (data.name.trim().length < 2) {
      throw new BadRequestException("El nombre del combo debe tener al menos 2 caracteres");
    }

    // Validación: El precio del combo debe ser un número válido, finito y mayor o igual a 0.
    const numericPrice = Number(data.price);
    if (isNaN(numericPrice) || !isFinite(numericPrice) || numericPrice < 0) {
      throw new BadRequestException("El precio del combo debe ser un valor numérico mayor o igual a 0");
    }

    // Validación: Un combo debe contener al menos un servicio asignado (o lista de items).
    const items = (data as { items?: { serviceId: string }[]; serviceIds?: string[] }).items ??
                  (data as { serviceIds?: string[] }).serviceIds;
    if (items && Array.isArray(items)) {
      if (items.length === 0) {
        throw new BadRequestException("El combo debe incluir al menos un servicio");
      }

      // Validación: Verificar que cada elemento referenciado contenga un ID de servicio válido y no duplicado.
      const ids = items.map((item) => (typeof item === "string" ? item.trim() : item.serviceId.trim()));
      for (const svcId of ids) {
        if (!svcId || svcId.length === 0) {
          throw new BadRequestException("Cada servicio asignado al combo debe tener un ID válido");
        }
      }
      if (new Set(ids).size !== ids.length) {
        throw new BadRequestException("No se permiten servicios duplicados dentro del mismo combo");
      }
    }

    return ServicePackageRepository.create(
      data
    );
  },


async update(id: string, data: UpdatePackageInput) {
    // Validación: Verificar que el ID del combo a actualizar sea válido.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID del combo es obligatorio");
    }

    // Validación: Comprobar que se envíe al menos un campo a modificar.
    if (
      data.name === undefined &&
      data.price === undefined &&
      data.state === undefined &&
      (data as { items?: unknown }).items === undefined &&
      (data as { serviceIds?: unknown }).serviceIds === undefined
    ) {
      throw new BadRequestException("Debes proporcionar al menos un campo para actualizar");
    }

    // Validación: Si se actualiza el nombre, no puede estar vacío ni tener menos de 2 caracteres.
    if (data.name !== undefined) {
      if (data.name.trim().length < 2) {
        throw new BadRequestException("El nombre del combo debe tener al menos 2 caracteres");
      }
    }

    // Validación: Si se actualiza el precio, debe ser un número válido y mayor o igual a 0.
    if (data.price !== undefined) {
      const numericPrice = Number(data.price);
      if (isNaN(numericPrice) || !isFinite(numericPrice) || numericPrice < 0) {
        throw new BadRequestException("El precio del combo debe ser un valor numérico mayor o igual a 0");
      }
    }

    // Validación: Si se actualizan los servicios del combo, no puede ser una lista vacía ni tener duplicados.
    const items = (data as { items?: { serviceId: string }[]; serviceIds?: string[] }).items ??
                  (data as { serviceIds?: string[] }).serviceIds;
    if (items !== undefined && Array.isArray(items)) {
      if (items.length === 0) {
        throw new BadRequestException("El combo debe incluir al menos un servicio");
      }
      const ids = items.map((item) => (typeof item === "string" ? item.trim() : item.serviceId.trim()));
      if (new Set(ids).size !== ids.length) {
        throw new BadRequestException("No se permiten servicios duplicados dentro del mismo combo");
      }
    }

    await this.getById(id.trim());
    return ServicePackageRepository.update(id.trim(), {
      ...data,
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      ...(data.price !== undefined ? { price: String(Number(data.price)) } : {}),
    });
  },

  async delete(id: string) {
    // Validación: Verificar que el ID del combo a eliminar no esté vacío.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID del combo es obligatorio");
    }

    await this.getById(id.trim());
    return ServicePackageRepository.delete(id.trim());
  },
};
