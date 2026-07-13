import { Request, Response, NextFunction } from 'express';
import { attendanceService } from './attendance.service.js';

export class AttendanceController {
  async punch(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await attendanceService.punch(userId, {
        latitude: req.body.latitude,
        longitude: req.body.longitude,
        locationId: req.body.locationId,
        type: req.body.type,
        wifiBssid: req.body.wifiBssid,
        selfieFile: req.file,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async getMyAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const result = await attendanceService.getMyAttendance(userId, {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        status: req.query.status as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
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

  async getTodayTimeline(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const records = await attendanceService.getTodayTimeline(userId);
      res.status(200).json({
        success: true,
        data: records,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async getAllAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.getAllAttendance({
        userId: req.query.userId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        status: req.query.status as string,
        type: req.query.type as string,
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

  async overrideAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.userId;
      const result = await attendanceService.overrideAttendance(
        req.params.id,
        adminId,
        req.body
      );
      res.status(200).json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const stats = await attendanceService.getStats(userId);
      res.status(200).json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async getLateReport(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.getLateReport({
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
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
}

export const attendanceController = new AttendanceController();
