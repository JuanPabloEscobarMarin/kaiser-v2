import { ServiceCategoryRepository } from "../repositories/service-category.repository.ts";
import { NotFoundException } from "../exceptions/HttpException.ts";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../validators/service-category.validators.ts";

export const ServiceCategoryService = {
  list: (includeInactive = false) =>
    ServiceCategoryRepository.all(includeInactive),

  async getById(id: string) {
    const category = await ServiceCategoryRepository.byId(id);
    if (!category) throw new NotFoundException("Categoría no encontrada");
    return category;
  },

  create: (data: CreateCategoryInput) => ServiceCategoryRepository.create(data),

  async update(id: string, data: UpdateCategoryInput) {
    await this.getById(id);
    return ServiceCategoryRepository.update(id, data);
  },

  async delete(id: string) {
    await this.getById(id);
    return ServiceCategoryRepository.delete(id);
  },
};
