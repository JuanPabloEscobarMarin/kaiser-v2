import { api } from "./client";

export interface EmployeeBlock {
  id: string;
  employeeId: string;
  date: string | null;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  isFullDay: boolean;
  reason: string | null;
  createdAt: string;
}

export interface CreateBlockInput {
  date?: string | null;
  dayOfWeek?: number | null;
  startTime: string;
  endTime: string;
  isFullDay?: boolean;
  reason?: string | null;
}

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const dayName = (dow: number) => DAY_NAMES[dow] ?? String(dow);

export const employeeBlocksApi = {
  list: (employeeId: string) =>
    api.get<EmployeeBlock[]>(`/employees/${employeeId}/blocks`),

  create: (employeeId: string, data: CreateBlockInput) =>
    api.post<{ message: string; data: EmployeeBlock }>(
      `/employees/${employeeId}/blocks`,
      data,
    ),

  remove: (employeeId: string, blockId: string) =>
    api.delete<{ message: string; id: string }>(
      `/employees/${employeeId}/blocks/${blockId}`,
    ),
};
