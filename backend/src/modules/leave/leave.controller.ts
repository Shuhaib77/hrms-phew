import { Request, Response, NextFunction } from 'express';
import { leaveService } from './leave.service.js';

export class LeaveController {
  async applyLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.applyLeave(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getMyLeaves(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.getMyLeaves(req.user!.userId, {
        status: req.query.status as string,
        type: req.query.type as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      res.status(200).json({ success: true, ...result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getAllLeaves(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.getAllLeaves({
        userId: req.query.userId as string,
        status: req.query.status as string,
        type: req.query.type as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      res.status(200).json({ success: true, ...result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async approveLeave(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.approveLeave(req.params.id, req.user!.userId, req.body.status, req.body.comment);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.getBalance(req.user!.userId);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async updateBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.updateBalance(req.user!.userId, req.body);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getCalendar(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await leaveService.getCalendar({
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        departmentId: req.query.departmentId as string,
      });
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }
}

export const leaveController = new LeaveController();
