import type { Request, Response } from "express";
import { EmployeeBlocksRepository } from "../repositories/employee-blocks.repository.ts";
import { EmployeeRepository } from "../repositories/employee.repository.ts";
import {
  NotFoundException,
  ForbiddenException,
} from "../exceptions/HttpException.ts";

export const EmployeeBlocksController = {
  async list(req: Request, res: Response) {
    const employeeId = String(req.params.id);
    const employee = await EmployeeRepository.byId(employeeId);
    if (!employee) throw new NotFoundException("Employee not found");
    const blocks = await EmployeeBlocksRepository.allByEmployee(employeeId);
    res.json(blocks);
  },

  async create(req: Request, res: Response) {
    const employeeId = String(req.params.id);
    const employee = await EmployeeRepository.byId(employeeId);
    if (!employee) throw new NotFoundException("Employee not found");
    const block = await EmployeeBlocksRepository.create(employeeId, req.body);
    res.status(201).json({ message: "Block created", data: block });
  },

  async delete(req: Request, res: Response) {
    const employeeId = String(req.params.id);
    const blockId = String(req.params.blockId);
    const block = await EmployeeBlocksRepository.byId(blockId);
    if (!block) throw new NotFoundException("Block not found");
    if (block.employeeId !== employeeId)
      throw new ForbiddenException("Block does not belong to this employee");
    await EmployeeBlocksRepository.delete(blockId);
    res.json({ message: "Block deleted", id: blockId });
  },
};
