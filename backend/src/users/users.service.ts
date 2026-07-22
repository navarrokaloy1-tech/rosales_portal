import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateStudentDto, CreateTeacherDto } from './dto';

export interface BulkRowResult {
  row: number;
  name: string;
  status: 'created' | 'failed';
  defaultPassword?: string;
  error?: string;
}

export interface BulkResult {
  created: number;
  failed: number;
  results: BulkRowResult[];
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(role?: Role): Promise<User[]> {
    return this.prisma.user.findMany({
      where: role ? { role } : undefined,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async createTeacher(dto: CreateTeacherDto): Promise<User> {
    const passwordHash = await AuthService.hash(dto.employeeId);
    return this.create({
      role: Role.Teacher,
      employeeId: dto.employeeId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      avatarColor: dto.avatarColor,
      passwordHash,
      mustChangePassword: true,
    });
  }

  async createStudent(dto: CreateStudentDto): Promise<User> {
    const passwordHash = await AuthService.hash(dto.studentId);
    return this.create({
      role: Role.Student,
      studentId: dto.studentId,
      lrn: dto.lrn ?? null,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      avatarColor: dto.avatarColor,
      passwordHash,
      mustChangePassword: true,
    });
  }

  async bulkCreateTeachers(rows: CreateTeacherDto[]): Promise<BulkResult> {
    const results: BulkRowResult[] = [];
    for (let i = 0; i < rows.length; i++) {
      const dto = rows[i];
      const name = `${dto.firstName} ${dto.lastName}`.trim();
      try {
        await this.createTeacher(dto);
        results.push({ row: i + 1, name, status: 'created', defaultPassword: dto.employeeId });
      } catch (e) {
        results.push({ row: i + 1, name, status: 'failed', error: toMessage(e) });
      }
    }
    return summarise(results);
  }

  async bulkCreateStudents(rows: CreateStudentDto[]): Promise<BulkResult> {
    const results: BulkRowResult[] = [];
    for (let i = 0; i < rows.length; i++) {
      const dto = rows[i];
      const name = `${dto.firstName} ${dto.lastName}`.trim();
      try {
        await this.createStudent(dto);
        results.push({ row: i + 1, name, status: 'created', defaultPassword: dto.studentId });
      } catch (e) {
        results.push({ row: i + 1, name, status: 'failed', error: toMessage(e) });
      }
    }
    return summarise(results);
  }

  private async create(data: Prisma.UserUncheckedCreateInput): Promise<User> {
    try {
      return await this.prisma.user.create({ data });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = (e.meta?.target as string[] | undefined)?.join(', ') ?? 'field';
        throw new ConflictException(`A user with this ${target} already exists.`);
      }
      throw e;
    }
  }
}

function summarise(results: BulkRowResult[]): BulkResult {
  return {
    created: results.filter(r => r.status === 'created').length,
    failed: results.filter(r => r.status === 'failed').length,
    results,
  };
}

function toMessage(e: unknown): string {
  if (e instanceof ConflictException) {
    const res = e.getResponse();
    if (typeof res === 'string') return res;
    if (typeof res === 'object' && res !== null && 'message' in res) {
      const msg = (res as { message?: unknown }).message;
      if (typeof msg === 'string') return msg;
      if (Array.isArray(msg)) return msg.join('; ');
    }
    return e.message;
  }
  if (e instanceof Error) return e.message;
  return 'Unknown error';
}
