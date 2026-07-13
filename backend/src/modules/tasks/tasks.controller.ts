import { Request, Response, NextFunction } from 'express';
import { tasksService } from './tasks.service.js';

export class TasksController {
  async getTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tasksService.getTasks({
        status: req.query.status as string,
        priority: req.query.priority as string,
        projectId: req.query.projectId as string,
        assigneeId: req.query.assigneeId as string,
        search: req.query.search as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
      });
      res.status(200).json({ success: true, ...result, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getTaskById(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.getTaskById(req.params.id);
      res.status(200).json({ success: true, data: task, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async createTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.createTask(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: task, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async updateTask(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await tasksService.updateTask(req.params.id, req.body);
      res.status(200).json({ success: true, data: task, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async deleteTask(req: Request, res: Response, next: NextFunction) {
    try {
      await tasksService.deleteTask(req.params.id);
      res.status(200).json({ success: true, data: { message: 'Task deleted' }, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const projects = await tasksService.getProjects();
      res.status(200).json({ success: true, data: projects, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await tasksService.createProject(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: project, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const project = await tasksService.updateProject(req.params.id, req.body);
      res.status(200).json({ success: true, data: project, timestamp: new Date().toISOString() });
    } catch (err) { next(err); }
  }
}

export const tasksController = new TasksController();
