import { Request, Response, NextFunction } from 'express';
import { payrollService } from './payroll.service.js';

export class PayrollController {
  async getMyPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const payslips = await payrollService.getMyPayslips(req.user!.userId);
      res.status(200).json({ success: true, data: payslips, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async downloadPayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.downloadPayslipPDF(req.params.id);
      res.download(result.path, result.filename);
    } catch (err) { next(err); }
  }

  async getPayslips(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.getPayslips({
        userId: req.query.userId as string,
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      res.status(200).json({ success: true, ...result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async generatePayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const payslip = await payrollService.generatePayslip(req.body.userId, req.body.month, req.body.year, req.user!.userId);
      res.status(201).json({ success: true, data: payslip, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async bulkGenerate(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await payrollService.bulkGenerate(req.body.month, req.body.year, req.user!.userId);
      res.status(200).json({ success: true, data: results, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async updatePayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await payrollService.updateDraftPayslip(req.params.id, req.body);
      res.status(200).json({ success: true, data: updated, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async finalizePayslip(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.finalizePayslip(req.params.id);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getSalaryStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.query.userId as string || req.user!.userId;
      const structure = await payrollService.getSalaryStructure(userId);
      res.status(200).json({ success: true, data: structure, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async updateSalaryStructure(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.body.userId || req.user!.userId;
      const structure = await payrollService.updateSalaryStructure(userId, req.body);
      res.status(200).json({ success: true, data: structure, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getOvertimeRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.getOvertimeRequests(req.query);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getMyOvertime(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.getMyOvertime(req.user!.userId);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async requestOvertime(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.requestOvertime(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async approveOvertime(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.approveOvertime(req.params.id, req.body.status, req.user!.userId);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getDisputes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.getDisputes(req.query);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getMyDisputes(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.getMyDisputes(req.user!.userId);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async raiseDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.raiseDispute(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async resolveDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.resolveDispute(req.params.id, req.body, req.user!.userId);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getIncompletePunches(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.getIncompletePunches(req.query);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async resolveIncompletePunch(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.resolveIncompletePunch(req.params.id, req.body, req.user!.userId);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getAdjustments(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.getAdjustments(req.query);
      res.status(200).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async createAdjustment(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await payrollService.createAdjustment(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }
}

export const payrollController = new PayrollController();