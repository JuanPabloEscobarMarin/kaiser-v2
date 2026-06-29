import type { HomeContent } from "@/core/branding/home-content";
export type { HomeContent } from "@/core/branding/home-content";

export type Role = "ADMIN" | "CLIENT" | "EMPLOYEE";
export type AppointmentState = "SCHEDULED" | "CANCELLED" | "FINISHED";

export interface BusinessSettings {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  openTimeWeekday: string;
  closeTimeWeekday: string;
  closedWeekday: boolean;
  openTimeSaturday: string;
  closeTimeSaturday: string;
  closedSaturday: boolean;
  openTimeSunday: string;
  closeTimeSunday: string;
  closedSunday: boolean;
  heroImageSlug?: string | null;
  logoSlug?: string | null;
  primaryColor: string;
  homeContent: HomeContent;
  updatedAt: string;
}

export type BusinessSettingsInput = Omit<BusinessSettings, "id" | "updatedAt">;

export interface User {
  id: string;
  username: string;
  role: Role;
  avatarSlug?: string | null;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  identification: string;
  createdAt: string;
}

export interface CustomerInput {
  fullName: string;
  phone: string;
  identification: string;
}

export interface Service {
  id: string;
  name: string;
  price: string;
  duration: number;
  state: boolean;
  discount: string;
  urlImage?: string | null;
  description?: string | null;
}

export interface EmployeeService {
  id: string;
  name: string;
  commission: string;
}

export interface Employee {
  id: string;
  fullName: string;
  phone: string;
  state: boolean;
  salary: string;
  urlImage?: string | null;
  userId?: string | null;
  services?: EmployeeService[];
}

export interface ScheduleBlock {
  id: string;
  employeeId: string;
  date?: string | null;
  dayOfWeek?: number | null;
  startTime: string;
  endTime: string;
  isFullDay: boolean;
  reason?: string | null;
  createdAt: string;
}

export interface Booking {
  id: string;
  appointmentId: string;
  customerId: string;
  bookedAt: string;
  customer?: Customer;
}

export interface Appointment {
  id: string;
  serviceId: string;
  employeeId: string;
  scheduledAt: string;
  endsAt: string;
  state: AppointmentState;
  createdAt: string;
  service?: Service;
  employee?: Employee;
  booking?: Booking | null;
}

export interface AvailabilitySlot {
  start: string;
  end: string;
}

export interface AvailabilityResponse {
  service: { id: string; name: string; duration: number };
  employee: { id: string; fullName: string };
  date: string;
  slots: AvailabilitySlot[];
}

export interface SearchResultItem {
  id: string;
  label: string;
  type: "service";
  score: number;
  meta: {
    price: string;
    duration: number;
    discount: string;
    urlImage?: string | null;
    description?: string | null;
  };
}
