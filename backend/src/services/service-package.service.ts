import { ServicePackageRepository } from "../repositories/service-package.repository.ts";
import { NotFoundException } from "../exceptions/HttpException.ts";
import type {
  CreatePackageInput,
  UpdatePackageInput,
} from "../validators/service-package.validators.ts";

export const ServicePackageService = {
  list: (includeInactive = false) =>
    ServicePackageRepository.all(includeInactive),

  async getById(id: string) {
    const pkg = await ServicePackageRepository.byId(id);
    if (!pkg) throw new NotFoundException("Combo no encontrado");
    return pkg;
  },

  create: (data: CreatePackageInput) => ServicePackageRepository.create(data),

  async update(id: string, data: UpdatePackageInput) {
    await this.getById(id);
    return ServicePackageRepository.update(id, data);
  },

  async delete(id: string) {
    await this.getById(id);
    return ServicePackageRepository.delete(id);
  },
};
