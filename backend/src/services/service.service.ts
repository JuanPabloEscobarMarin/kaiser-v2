import { ServiceRepository } from "../repositories/service.repository.ts";
import { NotFoundException } from "../exceptions/HttpException.ts";
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from "../validators/service.validators.ts";

export const ServiceService = {
  list: (includeInactive = false) => ServiceRepository.all(includeInactive),

  async getById(id: string) {
    const service = await ServiceRepository.byId(id);
    if (!service) throw new NotFoundException("Service not found");
    return service;
  },

  create: (data: CreateServiceInput) => ServiceRepository.create(data),

  async update(id: string, data: UpdateServiceInput) {
    await this.getById(id);
    return ServiceRepository.update(id, data);
  },

  async delete(id: string) {
    await this.getById(id);
    return ServiceRepository.delete(id);
  },

  deleteMany: (ids: string[]) => ServiceRepository.deleteMany(ids),
};
