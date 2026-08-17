import { ServiceRepository } from "../repositories/service.repository.ts";
import { BadRequestException, NotFoundException } from "../exceptions/HttpException.ts";
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from "../validators/service.validators.ts";

export const ServiceService = {
  list: (includeInactive = false) => ServiceRepository.all(includeInactive),

  async getById(id: string) {
    // Validación: Verificar que el ID del servicio no sea nulo, vacío ni consista solo en espacios.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID del servicio es obligatorio");
    }
    const service = await ServiceRepository.byId(id);
    if (!service) throw new NotFoundException("Servicio no encontrado");
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
