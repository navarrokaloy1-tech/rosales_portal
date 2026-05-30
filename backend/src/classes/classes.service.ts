import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, SchoolClass } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClassDto, UpdateClassDto } from './dto';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.schoolClass.findMany({
      orderBy: [{ schoolYear: 'desc' }, { gradeLevel: 'asc' }, { section: 'asc' }],
      include: {
        adviser: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { enrollments: { where: { status: 'Active' } }, subjects: true } },
      },
    });
  }

  async findOne(id: string) {
    const cls = await this.prisma.schoolClass.findUnique({
      where: { id },
      include: {
        adviser: { select: { id: true, firstName: true, lastName: true, email: true, avatarColor: true } },
        subjects: {
          include: {
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        enrollments: {
          where: { status: 'Active' },
          include: {
            student: {
              select: { id: true, firstName: true, lastName: true, lrn: true, studentId: true, email: true, avatarColor: true },
            },
          },
        },
      },
    });
    if (!cls) throw new NotFoundException(`Class ${id} not found`);
    return cls;
  }

  async create(dto: CreateClassDto): Promise<SchoolClass> {
    await this.assertIsTeacher(dto.adviserId);
    return this.prisma.schoolClass.create({ data: dto });
  }

  async update(id: string, dto: UpdateClassDto): Promise<SchoolClass> {
    if (dto.adviserId) await this.assertIsTeacher(dto.adviserId);
    try {
      return await this.prisma.schoolClass.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException(`Class ${id} not found`);
    }
  }

  private async assertIsTeacher(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u) throw new BadRequestException('Adviser user not found');
    if (u.role !== Role.Teacher) throw new BadRequestException('Adviser must be a Teacher');
  }
}
