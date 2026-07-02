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
  secondaryColor?: string | null;
  accentColor?: string | null;
  fontHeading?: string | null;
  fontBody?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
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
  email?: string | null;
  birthDate?: string | null;
  createdAt: string;
}

export interface CustomerInput {
  fullName: string;
  phone: string;
  email?: string | null;
  birthDate?: string | null;
}

export interface ServiceCategory {
  id: string;
  name: string;
  order: number;
  state?: boolean;
  createdAt?: string;
}

export interface Service {
  id: string;
  name: string;
  price: string;
  duration: number;
  state: boolean;
  discount: string;
  variablePrice?: boolean;
  categoryId?: string | null;
  category?: { id: string; name: string; order?: number } | null;
  urlImage?: string | null;
  description?: string | null;
}

export interface EmployeeService {
  id: string;
  name: string;
  commission: string;
}

export interface ServicePackageItem {
  serviceId: string;
  service?: { id: string; name: string; price: string; duration: number };
}

export interface ServicePackage {
  id: string;
  name: string;
  price: string;
  description?: string | null;
  urlImage?: string | null;
  state: boolean;
  items: ServicePackageItem[];
  createdAt?: string;
}

export interface Employee {
  id: string;
  fullName: string;
  phone: string;
  state: boolean;
  birthDate?: string | null;
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
  finalPrice?: string | null;
  packageId?: string | null;
  notes?: string | null;
  createdAt: string;
  service?: Service;
  employee?: Employee;
  services?: {
    serviceId: string;
    service?: { id: string; name: string; price: string; duration: number };
  }[];
  package?: { id: string; name: string; price: string } | null;
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
