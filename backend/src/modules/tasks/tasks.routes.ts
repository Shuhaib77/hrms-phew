import { Router } from 'express';
import { tasksController } from './tasks.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createTaskSchema, updateTaskSchema, taskFilterSchema, createProjectSchema, updateProjectSchema } from './tasks.validation.js';

const router = Router();

router.get('/', authenticate, validate({ query: taskFilterSchema }), tasksController.getTasks.bind(tasksController));
router.get('/:id', authenticate, tasksController.getTaskById.bind(tasksController));
router.post('/', authenticate, validate({ body: createTaskSchema }), tasksController.createTask.bind(tasksController));
router.put('/:id', authenticate, validate({ body: updateTaskSchema }), tasksController.updateTask.bind(tasksController));
router.delete('/:id', authenticate, tasksController.deleteTask.bind(tasksController));

export default router;

export const projectRouter = Router();
projectRouter.get('/', authenticate, tasksController.getProjects.bind(tasksController));
projectRouter.post('/', authenticate, requireRole('ADMIN', 'HR_MANAGER', 'MANAGER'), validate({ body: createProjectSchema }), tasksController.createProject.bind(tasksController));
projectRouter.put('/:id', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: updateProjectSchema }), tasksController.updateProject.bind(tasksController));
