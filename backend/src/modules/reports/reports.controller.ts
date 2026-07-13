import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';

export class ReportsController {
  async getAttendanceSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getAttendanceSummary({
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        departmentId: req.query.departmentId as string,
      });
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getPayrollSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getPayrollSummary({
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        departmentId: req.query.departmentId as string,
      });
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getLeaveSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reportsService.getLeaveSummary({
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        departmentId: req.query.departmentId as string,
      });
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }
}

export const reportsController = new ReportsController();
