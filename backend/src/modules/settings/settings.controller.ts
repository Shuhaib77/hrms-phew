import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service.js';

export class SettingsController {
  async getAttendancePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const policy = await settingsService.getAttendancePolicy();
      res.status(200).json({ success: true, data: policy, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async updateAttendancePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const policy = await settingsService.updateAttendancePolicy(req.body, req.user!.userId);
      res.status(200).json({ success: true, data: policy, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getCompanySettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.getCompanySettings();
      res.status(200).json({ success: true, data: settings, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async updateCompanySettings(req: Request, res: Response, next: NextFunction) {
    try {
      const settings = await settingsService.updateCompanySettings(req.body, req.user!.userId);
      res.status(200).json({ success: true, data: settings, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }
}

export const settingsController = new SettingsController();
