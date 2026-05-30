import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateStudentDto, CreateTeacherDto } from './dto';

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
