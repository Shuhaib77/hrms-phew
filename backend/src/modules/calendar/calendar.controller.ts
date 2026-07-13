import { Request, Response, NextFunction } from 'express';
import { calendarService } from './calendar.service.js';

export class CalendarController {
  async getHolidays(req: Request, res: Response, next: NextFunction) {
    try {
      const holidays = await calendarService.getHolidays({
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        locationId: req.query.locationId as string,
      });
      res.status(200).json({ success: true, data: holidays, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await calendarService.getEvents({
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
      });
      res.status(200).json({ success: true, data: events, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async createHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      const holiday = await calendarService.createHoliday(req.body);
      res.status(201).json({ success: true, data: holiday, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async deleteHoliday(req: Request, res: Response, next: NextFunction) {
    try {
      await calendarService.deleteHoliday(req.params.id);
      res.status(200).json({ success: true, data: { message: 'Holiday deleted' }, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }
}

export const calendarController = new CalendarController();
