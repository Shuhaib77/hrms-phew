import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';

export class LocationsService {
  async getAll(filters: { search?: string; isActive?: boolean; page: number; limit: number }) {
    const where: any = {};
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const [data, total] = await Promise.all([
      prisma.location.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        include: {
          _count: { select: { employeeAssignments: true } },
        },
      }),
      prisma.location.count({ where }),
    ]);

    const mapped = data.map((loc) => ({
      ...loc,
      employeeCount: loc._count.employeeAssignments,
      _count: undefined,
    }));

    return {
      data: mapped,
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

  async getById(id: string) {
    const location = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: { select: { employeeAssignments: true, attendanceRecords: true } },
      },
    });
    if (!location) {
      throw new AppError('Location not found', 404, 'LOCATION_NOT_FOUND');
    }
    return { ...location, employeeCount: location._count.employeeAssignments };
  }

  async create(data: {
    name: string;
    address?: string;
    latitude: number;
    longitude: number;
    radius?: number;
    isActive?: boolean;
    isWifiVerificationEnabled?: boolean;
    wifiBssids?: string[];
  }) {
    const location = await prisma.location.create({
      data: {
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius ?? 100,
        isActive: data.isActive ?? true,
        isWifiVerificationEnabled: data.isWifiVerificationEnabled ?? false,
        wifiBssids: data.wifiBssids ?? [],
      },
    });
    return location;
  }

  async update(
    id: string,
    data: {
      name?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      radius?: number;
      isActive?: boolean;
      isWifiVerificationEnabled?: boolean;
      wifiBssids?: string[];
    }
  ) {
    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Location not found', 404, 'LOCATION_NOT_FOUND');
    }

    const updateData: any = { ...data };

    const location = await prisma.location.update({
      where: { id },
      data: updateData,
    });
    return location;
  }

  async delete(id: string) {
    const existing = await prisma.location.findUnique({
      where: { id },
      include: {
        _count: { select: { employeeAssignments: true, attendanceRecords: true } },
      },
    });
    if (!existing) {
      throw new AppError('Location not found', 404, 'LOCATION_NOT_FOUND');
    }
    if (existing._count.employeeAssignments > 0 || existing._count.attendanceRecords > 0) {
      throw new AppError(
        'Cannot delete location with active assignments or attendance records',
        400,
        'LOCATION_IN_USE'
      );
    }

    await prisma.location.delete({ where: { id } });
  }
}

export const locationsService = new LocationsService();
