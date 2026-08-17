import { EmployeeDeductionRepository } from "../repositories/employee-deduction.repository.ts";
import { EmployeeRepository } from "../repositories/employee.repository.ts";
import {
  BadRequestException,
  NotFoundException,
} from "../exceptions/HttpException.ts";
import type {
  CreateDeductionInput,
  ListDeductionsQuery,
} from "../validators/employee-deduction.validators.ts";

const startOfDay = (ymd: string) => new Date(`${ymd}T00:00:00.000Z`);
const endOfDay = (ymd: string) => new Date(`${ymd}T23:59:59.999Z`);

const isValidYmd = (ymd: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;
  const d = new Date(`${ymd}T00:00:00.000Z`);
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === ymd;
};

export const EmployeeDeductionService = {
  async listByEmployee(employeeId: string) {
    // Validación: Verificar que el ID del empleado no sea nulo, vacío ni consista solo en espacios.
    if (!employeeId || employeeId.trim().length === 0) {
      throw new BadRequestException("El ID del empleado es obligatorio");
    }

    return EmployeeDeductionRepository.byEmployee(employeeId.trim());
  },

  async list(query: ListDeductionsQuery) {
    // Validación: Si se envía filtro de empleado, validar que no sea una cadena vacía.
    if (query.employeeId !== undefined && query.employeeId.trim().length === 0) {
      throw new BadRequestException("El ID del empleado no puede estar vacío");
    }

    // Validación: Verificar formato y validez de calendario en fecha inicial (from).
    if (query.from !== undefined) {
      if (!isValidYmd(query.from.trim())) {
        throw new BadRequestException("La fecha inicial ('from') debe tener un formato válido YYYY-MM-DD");
      }
    }

    // Validación: Verificar formato y validez de calendario en fecha final (to).
    if (query.to !== undefined) {
      if (!isValidYmd(query.to.trim())) {
        throw new BadRequestException("La fecha final ('to') debe tener un formato válido YYYY-MM-DD");
      }
    }

    // Validación: Regla de coherencia temporal: la fecha inicial no puede ser posterior a la fecha final.
    if (query.from && query.to) {
      const fromDate = startOfDay(query.from.trim());
      const toDate = endOfDay(query.to.trim());
      if (fromDate.getTime() > toDate.getTime()) {
        throw new BadRequestException("La fecha inicial no puede ser posterior a la fecha final");
      }
    }

    return EmployeeDeductionRepository.list({
      ...(query.employeeId ? { employeeId: query.employeeId.trim() } : {}),
      ...(query.from ? { from: startOfDay(query.from.trim()) } : {}),
      ...(query.to ? { to: endOfDay(query.to.trim()) } : {}),
    });
  },

  async create(data: CreateDeductionInput) {
    // Validación: El ID del empleado es obligatorio para asociar la deducción.
    if (!data.employeeId || data.employeeId.trim().length === 0) {
      throw new BadRequestException("El ID del empleado es obligatorio");
    }

    // Validación: Verificar que el empleado exista en la base de datos antes de crear la deducción.
    const employee = await EmployeeRepository.byId(data.employeeId.trim());
    if (!employee) {
      throw new NotFoundException("El empleado especificado no existe");
    }

    // Validación: El monto de la deducción debe ser un número válido, finito y estrictamente mayor a 0.
    const numericAmount = Number(data.amount);
    if (isNaN(numericAmount) || !isFinite(numericAmount) || numericAmount <= 0) {
      throw new BadRequestException("El monto de la deducción debe ser un número mayor a 0");
    }

    // Validación: El tipo de deducción es obligatorio (ej. ADELANTO, PRODUCTO, MULTA, OTRO).
    if (!data.type || data.type.trim().length === 0) {
      throw new BadRequestException("El tipo de deducción es obligatorio");
    }

    return EmployeeDeductionRepository.create(data);
  },

  async delete(id: string) {
    // Validación: Verificar que el ID de la deducción a eliminar no esté vacío.
    if (!id || id.trim().length === 0) {
      throw new BadRequestException("El ID de la deducción es obligatorio");
    }

    const found = await EmployeeDeductionRepository.byId(id.trim());
    if (!found) throw new NotFoundException("Deducción no encontrada");
    return EmployeeDeductionRepository.delete(id.trim());
  },
};