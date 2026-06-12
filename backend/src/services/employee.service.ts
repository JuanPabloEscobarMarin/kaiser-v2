import { EmployeeRepository } from "../repositories/employee.repository.ts";
import { NotFoundException } from "../exceptions/HttpException.ts";
import type {
  CreateEmployeeInput,
  UpdateEmployeeInput,
} from "../validators/employee.validators.ts";

/**
 * Fields safe to expose to anonymous callers (the public booking flow only
 * needs the name and which services an employee performs). Salary, commission,
 * phone and the linked user account are intentionally withheld.
 */
const toPublicEmployee = (employee: any) => ({
  id: employee.id,
  fullName: employee.fullName,
  state: employee.state,
  services: (employee.services ?? []).map((s: any) => ({
    id: s.id,
    name: s.name,
  })),
});

export const EmployeeService = {
  /**
   * @param includeSensitive when true (admins only) returns salary, commission,
   *   phone and account linkage; otherwise a public projection.
   */
  async list(serviceId?: string, includeSensitive = false) {
    const employees = await EmployeeRepository.all(serviceId);
    return includeSensitive ? employees : employees.map(toPublicEmployee);
  },

  async getById(id: string) {
    const employee = await EmployeeRepository.byId(id);
    if (!employee) throw new NotFoundException("Employee not found");
    return employee;
  },

  /** Public-safe single employee lookup (no sensitive fields). */
  async getPublicById(id: string) {
    return toPublicEmployee(await this.getById(id));
  },

  create: (data: CreateEmployeeInput) => EmployeeRepository.create(data),

  async update(id: string, data: UpdateEmployeeInput) {
    await this.getById(id);
    return EmployeeRepository.update(id, data as Parameters<typeof EmployeeRepository.update>[1]);
  },

  async delete(id: string) {
    await this.getById(id);
    return EmployeeRepository.delete(id);
  },
};
