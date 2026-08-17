import { CustomerRepository } from "../repositories/customer.repository.ts";
import { BadRequestException } from "../exceptions/HttpException.ts";
import type { CustomerInput } from "../validators/customer.validators.ts";

export const CustomerService = {
  list: () => CustomerRepository.all(),

  async byPhone(phone: string) {
    // Validación: Verificar que el teléfono no sea nulo, indefinido ni esté compuesto solo de espacios.
    if (!phone || phone.trim().length === 0) {
      throw new BadRequestException("El número de teléfono es obligatorio");
    }

    // Validación: Comprobar que el teléfono tenga una longitud adecuada para un número de contacto.
    const cleanPhone = phone.trim();
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      throw new BadRequestException("El número de teléfono no tiene un formato válido");
    }

    return CustomerRepository.byPhone(cleanPhone);
  },

  async upsert(data: CustomerInput) {
    // Validación: El nombre del cliente es obligatorio y no puede consistir únicamente en espacios en blanco.
    if (!data.fullName || data.fullName.trim().length === 0) {
      throw new BadRequestException("El nombre del cliente es obligatorio");
    }

    // Validación: Longitud mínima del nombre para garantizar datos de contacto legibles.
    if (data.fullName.trim().length < 2) {
      throw new BadRequestException("El nombre del cliente debe tener al menos 2 caracteres");
    }

    // Validación: El número de teléfono es obligatorio y debe tener entre 10 y 15 caracteres.
    if (!data.phone || data.phone.trim().length === 0) {
      throw new BadRequestException("El número de teléfono es obligatorio");
    }
    const cleanPhone = data.phone.trim();
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      throw new BadRequestException("El número de teléfono debe tener entre 10 y 15 caracteres");
    }

    // Validación: Si se envía un correo electrónico, verificar que cumpla la estructura estándar de email.
    if (data.email !== undefined && data.email !== null) {
      const cleanEmail = data.email.trim();
      if (cleanEmail.length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          throw new BadRequestException("El formato del correo electrónico no es válido");
        }
      }
    }

    // Validación: Si se envía fecha de nacimiento, comprobar que sea una fecha real válida y que no esté en el futuro, o que nacio hace apenas unos días.
    if (data.birthDate !== undefined && data.birthDate !== null) {
      const bDate = new Date(data.birthDate);
      if (isNaN(bDate.getTime())) {
        throw new BadRequestException("La fecha de nacimiento no es una fecha válida");
      }
      if (bDate.getTime() > Date.now()) {
        throw new BadRequestException("La fecha de nacimiento no puede estar en el futuro");
      }
      const ageInYears = (Date.now() - bDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      if (ageInYears < 1) {
        throw new BadRequestException("La fecha de nacimiento no puede ser de hace menos de un año");
      }
    }

    return CustomerRepository.upsert({
      ...data,
      fullName: data.fullName.trim(),
      phone: cleanPhone,
      email: data.email ? data.email.trim().toLowerCase() : data.email,
    });
  },
};