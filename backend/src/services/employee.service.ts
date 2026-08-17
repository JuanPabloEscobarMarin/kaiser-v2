import { EmployeeRepository } from "../repositories/employee.repository.ts";
import { BadRequestException, NotFoundException } from "../exceptions/HttpException.ts";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "../validators/employee.validators.ts";

/**
 * Fields safe to expose to anonymous callers (the public booking flow only
 * needs the name and which services an employee performs). Commission,
 * phone and the linked user account are intentionally withheld.
 */
interface EmployeeLike {
  id: string;
  fullName: string;
  state: boolean;
  urlImage?: string | null;
  services?: { id: string; name: string }[];
}

const toPublicEmployee = (employee: EmployeeLike) => ({
  id: employee.id,
  fullName: employee.fullName,
  state: employee.state,
  urlImage: employee.urlImage ?? null,
  services: (employee.services ?? []).map((s) => ({
    id: s.id,
    name: s.name,
  })),
});

export const EmployeeService = {
  /**
   * @param includeSensitive when true (admins only) returns commission,
   *   phone and account linkage; otherwise a public projection.
   */
  async list(serviceId?: string, includeSensitive = false) {
    // Validación: Si se proporciona serviceId para filtrar, verificar que no sea una cadena vacía ni espacios.
    if (serviceId !== undefined && serviceId.trim().length === 0) {
      throw new BadRequestException("El ID del servicio no puede estar vacío");
    }
    // Solo el admin ve (y puede reactivar) empleados desactivados; antes el
    // soft-delete los hacía invisibles para siempre.
    const employees = await EmployeeRepository.all(serviceId, includeSensitive);
    return includeSensitive ? employees : employees.map(toPublicEmployee);
  },

  async getById(id: string) {
    // Validación: Verificar que el ID del empleado no sea nulo, vacío ni compuesto solo por espacios.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID del empleado es obligatorio");
    }

    const employee = await EmployeeRepository.byId(id);
    if (!employee) throw new NotFoundException("Empleado no encontrado");
    return employee;
  },

  /** Public-safe single employee lookup (no sensitive fields). */
  async getPublicById(id: string) {
    return toPublicEmployee(await this.getById(id));
  },

  async create(data: CreateEmployeeInput) {
    // Validación: El nombre completo del empleado es obligatorio y no puede consistir solo en espacios.
    if (!data.fullName || data.fullName.trim().length === 0) {
      throw new BadRequestException("El nombre del empleado es obligatorio");
    }

    // Validación: Longitud mínima del nombre completo para evitar registros incompletos.
    if (data.fullName.trim().length < 2) {
      throw new BadRequestException("El nombre del empleado debe tener al menos 2 caracteres");
    }

    // Validación: Si se proporciona teléfono, verificar formato y longitud mínima de contacto.
    if (data.phone !== undefined && data.phone !== null) {
      const cleanPhone = data.phone.trim();
      if (cleanPhone.length > 0 && (cleanPhone.length < 7 || cleanPhone.length > 20)) {
        throw new BadRequestException("El número de teléfono debe tener entre 7 y 20 caracteres");
      }
    }

    // Validación: Si se asignan servicios y comisiones iniciales, validar que las tasas de comisión sean porcentajes coherentes (0 a 100%).
    if (data.services && Array.isArray(data.services)) {
      for (const item of data.services) {
        if (!item.serviceId || item.serviceId.trim().length === 0) {
          throw new BadRequestException("Cada servicio asignado debe incluir un serviceId válido");
        }
        if (item.commission !== undefined && item.commission !== null) {
          const comm = Number(item.commission);
          if (isNaN(comm) || comm < 0 || comm > 100) {
            throw new BadRequestException("La comisión del servicio debe ser un porcentaje entre 0 y 100");
          }
        }
      }
    }

    return EmployeeRepository.create({
      ...data,
      fullName: data.fullName.trim(),
      ...(data.phone ? { phone: data.phone.trim() } : {}),
    });
  },

  async update(id: string, data: UpdateEmployeeInput) {
    // Validación: Verificar que el ID del empleado a actualizar sea válido.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID del empleado es obligatorio");
    }

    // Validación: Comprobar que se envíe al menos un campo a modificar.
    if (
      data.fullName === undefined &&
      data.phone === undefined &&
      data.state === undefined &&
      data.urlImage === undefined &&
      data.services === undefined
    ) {
      throw new BadRequestException("Debes proporcionar al menos un campo para actualizar");
    }

    // Validación: Si se actualiza el nombre, no puede estar vacío ni tener menos de 2 caracteres.
    if (data.fullName !== undefined) {
      if (data.fullName.trim().length < 2) {
        throw new BadRequestException("El nombre del empleado debe tener al menos 2 caracteres");
      }
    }

    // Validación: Si se actualiza el teléfono, verificar que cumpla longitud estándar.
    if (data.phone !== undefined && data.phone !== null) {
      const cleanPhone = data.phone.trim();
      if (cleanPhone.length > 0 && (cleanPhone.length < 7 || cleanPhone.length > 20)) {
        throw new BadRequestException("El número de teléfono debe tener entre 7 y 20 caracteres");
      }
    }

    // Validación: Validar rango de comisiones si se actualizan servicios asociados.
    if (data.services && Array.isArray(data.services)) {
      for (const item of data.services) {
        if (!item.serviceId || item.serviceId.trim().length === 0) {
          throw new BadRequestException("Cada servicio asignado debe incluir un serviceId válido");
        }
        if (item.commission !== undefined && item.commission !== null) {
          const comm = Number(item.commission);
          if (isNaN(comm) || comm < 0 || comm > 100) {
            throw new BadRequestException("La comisión del servicio debe ser un porcentaje entre 0 y 100");
          }
        }
      }
    }

    await this.getById(id.trim());
    return EmployeeRepository.update(id.trim(), {
      ...data,
      ...(data.fullName ? { fullName: data.fullName.trim() } : {}),
      ...(data.phone ? { phone: data.phone.trim() } : {}),
    } as Parameters<typeof EmployeeRepository.update>[1]);
  },

  async delete(id: string) {
    // Validación: Verificar que el ID del empleado a eliminar no sea nulo ni vacío.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID del empleado es obligatorio");
    }
    await this.getById(id);
    return EmployeeRepository.delete(id);
  },
};
