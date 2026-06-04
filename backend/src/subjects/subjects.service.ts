import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role, Subject } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { classId?: string; teacherId?: string }) {
    return this.prisma.subject.findMany({
      where: {
        ...(filters?.classId ? { classId: filters.classId } : {}),
        ...(filters?.teacherId ? { teacherId: filters.teacherId } : {}),
      },
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        class: { select: { id: true, name: true, gradeLevel: true, section: true } },
      },
      orderBy: [{ class: { gradeLevel: 'asc' } }, { code: 'asc' }],
    });
  }

  async findOne(id: string): Promise<Subject> {
    const s = await this.prisma.subject.findUnique({ where: { id } });
    if (!s) throw new NotFoundException(`Subject ${id} not found`);
    return s;
  }

  async create(dto: CreateSubjectDto, requester: { id: string; role: Role }): Promise<Subject> {
    // Teacher self-create → force teacherId to the requester. Admin → use as provided.
    let teacherId = dto.teacherId;
    if (requester.role === Role.Teacher) {
      if (dto.teacherId && dto.teacherId !== requester.id) {
        throw new ForbiddenException('Teachers can only create subjects assigned to themselves');
      }
      teacherId = requester.id;
    }
    if (!teacherId) throw new BadRequestException('teacherId is required');

    await this.assertClassExists(dto.classId);
    await this.assertIsTeacher(teacherId);

    return this.prisma.subject.create({
      data: {
        code: dto.code,
        name: dto.name,
        classId: dto.classId,
        teacherId,
        units: dto.units ?? 1.0,
      },
    });
  }

  async update(id: string, dto: UpdateSubjectDto, requester: { id: string; role: Role }): Promise<Subject> {
    const existing = await this.prisma.subject.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Subject ${id} not found`);

    if (requester.role === Role.Teacher) {
      if (existing.teacherId !== requester.id) throw new ForbiddenException('Not your subject');
      if (dto.teacherId && dto.teacherId !== requester.id) {
        throw new ForbiddenException('Teachers cannot reassign subjects to others');
      }
    }
    if (dto.classId) await this.assertClassExists(dto.classId);
    if (dto.teacherId) await this.assertIsTeacher(dto.teacherId);

    return this.prisma.subject.update({ where: { id }, data: dto });
  }

  async delete(id: string, requester: { id: string; role: Role }): Promise<{ ok: true }> {
    const existing = await this.prisma.subject.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Subject ${id} not found`);
    if (requester.role === Role.Teacher && existing.teacherId !== requester.id) {
      throw new ForbiddenException('Not your subject');
    }
    await this.prisma.subject.delete({ where: { id } });
    return { ok: true };
  }

  private async assertClassExists(classId: string) {
    const cls = await this.prisma.schoolClass.findUnique({ where: { id: classId }, select: { id: true } });
    if (!cls) throw new BadRequestException('Class not found');
  }

  private async assertIsTeacher(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u) throw new BadRequestException('Teacher user not found');
    if (u.role !== Role.Teacher) throw new BadRequestException('Assigned user is not a Teacher');
  }
}
