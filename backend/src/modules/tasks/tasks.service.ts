import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

export class TasksService {
  async getTasks(filters: {
    status?: string;
    priority?: string;
    projectId?: string;
    assigneeId?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.assigneeId) {
      where.assignees = { some: { userId: filters.assigneeId } };
    }
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          project: { select: { id: true, name: true } },
          assignees: {
            include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
          },
          createdBy: { select: { id: true, firstName: true, lastName: true } },
        },
      }),
      prisma.task.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
        hasNext: filters.page * filters.limit < total,
        hasPrev: filters.page > 1,
      },
    };
  }

  async getTaskById(id: string) {
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        assignees: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    if (!task) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    return task;
  }

  async createTask(
    userId: string,
    data: {
      title: string;
      description?: string;
      priority?: string;
      status?: string;
      projectId?: string;
      assigneeIds?: string[];
      dueDate?: string;
    }
  ) {
    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        priority: (data.priority || 'MEDIUM') as any,
        status: (data.status || 'TODO') as any,
        projectId: data.projectId || undefined,
        createdById: userId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assignees: data.assigneeIds?.length
          ? { create: data.assigneeIds.map((uid) => ({ userId: uid })) }
          : undefined,
      },
      include: {
        project: { select: { id: true, name: true } },
        assignees: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return task;
  }

  async updateTask(
    id: string,
    data: {
      title?: string;
      description?: string;
      priority?: string;
      status?: string;
      projectId?: string | null;
      assigneeIds?: string[];
      dueDate?: string | null;
    }
  ) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;

    if (data.assigneeIds !== undefined) {
      await prisma.taskAssignee.deleteMany({ where: { taskId: id } });
      if (data.assigneeIds.length > 0) {
        await prisma.taskAssignee.createMany({
          data: data.assigneeIds.map((uid) => ({ taskId: id, userId: uid })),
        });
      }
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: { select: { id: true, name: true } },
        assignees: {
          include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
        },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return task;
  }

  async deleteTask(id: string) {
    const existing = await prisma.task.findUnique({ where: { id } });
    if (!existing) throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');

    await prisma.taskAssignee.deleteMany({ where: { taskId: id } });
    await prisma.task.delete({ where: { id } });
  }

  async getProjects() {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        _count: { select: { tasks: true } },
      },
    });
    return projects;
  }

  async createProject(userId: string, data: {
    name: string;
    description?: string;
    clientId?: string;
    startDate?: string;
    endDate?: string;
    budget?: number;
  }) {
    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        clientId: data.clientId,
        createdById: userId,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget,
      },
      include: {
        client: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    return project;
  }

  async updateProject(id: string, data: {
    name?: string;
    description?: string;
    clientId?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    budget?: number;
  }) {
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.startDate !== undefined) updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.budget !== undefined) updateData.budget = data.budget;

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
      },
    });
    return project;
  }
}

export const tasksService = new TasksService();
