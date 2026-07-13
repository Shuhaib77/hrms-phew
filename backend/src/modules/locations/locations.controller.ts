import { Request, Response, NextFunction } from 'express';
import { locationsService } from './locations.service.js';

export class LocationsController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await locationsService.getAll({
        search: req.query.search as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await locationsService.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: location,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await locationsService.create(req.body);
      res.status(201).json({
        success: true,
        data: location,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const location = await locationsService.update(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: location,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await locationsService.delete(req.params.id);
      res.status(200).json({
        success: true,
        data: { message: 'Location deleted successfully' },
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }
}

export const locationsController = new LocationsController();
