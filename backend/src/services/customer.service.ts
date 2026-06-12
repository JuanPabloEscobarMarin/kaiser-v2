import { CustomerRepository } from "../repositories/customer.repository.ts";
import type { CustomerInput } from "../validators/customer.validators.ts";

export const CustomerService = {
  list: () => CustomerRepository.all(),
  byIdentification: (id: string) => CustomerRepository.byIdentification(id),
  upsert: (data: CustomerInput) => CustomerRepository.upsert(data),
};
