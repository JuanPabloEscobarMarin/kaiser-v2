import { EmployeeDeductionRepository } from "../repositories/employee-deduction.repository.ts";
import { NotFoundException } from "../exceptions/HttpException.ts";
import type {
  CreateDeductionInput,
  ListDeductionsQuery,
} from "../validators/employee-deduction.validators.ts";

const startOfDay = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
const endOfDay = (ymd: string) => new Date(`${ymd}T23:59:59.999Z`);

export const EmployeeDeductionService = {
  listByEmployee: (employeeId: string) =>
    EmployeeDeductionRepository.byEmployee(employeeId),

  list: (query: ListDeductionsQuery) =>
    EmployeeDeductionRepository.list({
      ...(query.employeeId ? { employeeId: query.employeeId } : {}),
      ...(query.from ? { from: startOfDay(query.from) } : {}),
      ...(query.to ? { to: endOfDay(query.to) } : {}),
    }),

  create: (data: CreateDeductionInput) =>
    EmployeeDeductionRepository.create(data),

  async delete(id: string) {
    const found = await EmployeeDeductionRepository.byId(id);
    if (!found) throw new NotFoundException("Deducción no encontrada");
    return EmployeeDeductionRepository.delete(id);
  },
};
