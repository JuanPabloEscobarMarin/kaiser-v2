import { ServiceCategoryRepository } from "../repositories/service-category.repository.ts";
import { BadRequestException, NotFoundException } from "../exceptions/HttpException.ts";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/service-category.validators.ts";

export const ServiceCategoryService = {
  list: (includeInactive = false) =>
    ServiceCategoryRepository.all(includeInactive),

  async getById(id: string) {
    // Validación: Verificar que el ID de la categoría no sea nulo, vacío ni consista solo en espacios.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID de la categoría es obligatorio");
    }
    const category = await ServiceCategoryRepository.byId(id);
    if (!category) throw new NotFoundException("Categoría no encontrada");
    return category;
  },

  async create(data: CreateCategoryInput) {
    // Validación: El nombre de la categoría es obligatorio y no puede consistir únicamente en espacios en blanco.
    if (!data.name || data.name.trim().length === 0) {
      throw new BadRequestException("El nombre de la categoría es obligatorio");
    }

    // Validación: Longitud mínima del nombre de la categoría para evitar nombres ambiguos.
    if (data.name.trim().length < 2) {
      throw new BadRequestException("El nombre de la categoría debe tener al menos 2 caracteres");
    }

    return ServiceCategoryRepository.create({
      ...data,
      name: data.name.trim(),
    });
  },

async update(id: string, data: UpdateCategoryInput) {
    // Validación: Verificar que el ID de la categoría a actualizar sea válido.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID de la categoría es obligatorio");
    }

    // Validación: Comprobar que se envíe al menos un campo a modificar en la petición.
    if (
      data.name === undefined &&
      data.state === undefined
    ) {
      throw new BadRequestException("Debes proporcionar al menos un campo para actualizar");
    }

    // Validación: Si se actualiza el nombre, no puede estar vacío ni tener menos de 2 caracteres.
    if (data.name !== undefined) {
      if (data.name.trim().length < 2) {
        throw new BadRequestException("El nombre de la categoría debe tener al menos 2 caracteres");
      }
    }

    await this.getById(id.trim());
    return ServiceCategoryRepository.update(id.trim(), data);
  },

  async delete(id: string) {
    // Validación: Verificar que el ID de la categoría a eliminar no esté vacío.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID de la categoría es obligatorio");
    }

    await this.getById(id.trim());
    return ServiceCategoryRepository.delete(id.trim());
  },
};
