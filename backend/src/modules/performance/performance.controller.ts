import { Request, Response, NextFunction } from 'express';
import { performanceService } from './performance.service.js';

export class PerformanceController {
  async getReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const reviews = await performanceService.getReviews(req.params.userId);
      res.status(200).json({ success: true, data: reviews, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await performanceService.createReview({
        ...req.body,
        reviewerId: req.user!.userId,
      });
      res.status(201).json({ success: true, data: review, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getCurrentEOM(req: Request, res: Response, next: NextFunction) {
    try {
      const eom = await performanceService.getCurrentEOM();
      res.status(200).json({ success: true, data: eom, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getEOMHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const history = await performanceService.getEOMHistory(limit);
      res.status(200).json({ success: true, data: history, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async selectEOM(req: Request, res: Response, next: NextFunction) {
    try {
      const eom = await performanceService.selectEOM(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: eom, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getSuggestions(req: Request, res: Response, next: NextFunction) {
    try {
      const suggestions = await performanceService.getSuggestions();
      res.status(200).json({ success: true, data: suggestions, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }
}

export const performanceController = new PerformanceController();
