import { Request, Response, NextFunction } from 'express';
import { employeeService } from './employee.service.js';

export class EmployeeController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.list({
        departmentId: req.query.departmentId as string,
        role: req.query.role as string,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: req.query.sortBy as string,
        sortOrder: req.query.sortOrder as 'asc' | 'desc',
      });
      res.status(200).json({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await employeeService.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await employeeService.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: user,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await employeeService.deactivate(req.params.id);
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async getBirthdays(req: Request, res: Response, next: NextFunction) {
    try {
      const birthdays = await employeeService.getBirthdays();
      res.status(200).json({
        success: true,
        data: birthdays,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async getAnniversaries(req: Request, res: Response, next: NextFunction) {
    try {
      const anniversaries = await employeeService.getAnniversaries();
      res.status(200).json({
        success: true,
        data: anniversaries,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}

export const employeeController = new EmployeeController();
