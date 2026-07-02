import { EmployeeDeductionRepository } from "../repositories/employee-deduction.repository.ts";
import { NotFoundException } from "../exceptions/HttpException.ts";
import type { CreateDeductionInput } from "../validators/employee-deduction.validators.ts";

export const EmployeeDeductionService = {
  listByEmployee: (employeeId: string) =>
    EmployeeDeductionRepository.byEmployee(employeeId),

  create: (data: CreateDeductionInput) =>
    EmployeeDeductionRepository.create(data),

  async delete(id: string) {
    const found = await EmployeeDeductionRepository.byId(id);
    if (!found) throw new NotFoundException("Deducción no encontrada");
    return EmployeeDeductionRepository.delete(id);
  },
};
