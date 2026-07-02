import { CustomerRepository } from "../repositories/customer.repository.ts";
import type { CustomerInput } from "../validators/customer.validators.ts";

export const CustomerService = {
  list: () => CustomerRepository.all(),
  byPhone: (phone: string) => CustomerRepository.byPhone(phone),
  upsert: (data: CustomerInput) => CustomerRepository.upsert(data),
};
