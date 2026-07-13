import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import { prisma } from '../../config/database.js';
import { AppError } from '../../middleware/errorHandler.js';
import { generateEmployeeId } from '../../shared/utils.js';

export class AuthService {
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
    departmentId?: string;
    managerId?: string;
    designation?: string;
    dateOfJoining?: string;
    dateOfBirth?: string;
    address?: string;
    emergencyContact?: string;
    emergencyPhone?: string;
  }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(data.password, config.bcryptRounds);
    const employeeId = generateEmployeeId();

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: (data.role as any) || 'EMPLOYEE',
        employeeId,
        departmentId: data.departmentId,
        managerId: data.managerId,
        designation: data.designation,
        dateOfJoining: data.dateOfJoining ? new Date(data.dateOfJoining) : null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        address: data.address,
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        employeeId: true,
        role: true,
        designation: true,
        departmentId: true,
        isActive: true,
        createdAt: true,
      },
    });

    return user;
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        employeeId: true,
        isActive: true,
        avatar: true,
        designation: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn } as jwt.SignOptions
    );

    const { password: _, ...userWithoutPassword } = user;
    return { token, user: userWithoutPassword };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        employeeId: true,
        designation: true,
        departmentId: true,
        department: { select: { id: true, name: true, code: true } },
        managerId: true,
        manager: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        dateOfJoining: true,
        dateOfBirth: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return user;
  }

  async updateProfile(userId: string, data: Record<string, any>) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        designation: true,
        address: true,
        emergencyContact: true,
        emergencyPhone: true,
        dateOfBirth: true,
      },
    });
    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }

    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }
}

export const authService = new AuthService();
