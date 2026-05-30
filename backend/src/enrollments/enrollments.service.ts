import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatus, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(classId?: string, studentId?: string) {
    return this.prisma.enrollment.findMany({
      where: {
        ...(classId ? { classId } : {}),
        ...(studentId ? { studentId } : {}),
      },
      include: {
        student: {
          select: { id: true, firstName: true, lastName: true, lrn: true, studentId: true, email: true, avatarColor: true },
        },
        class: { select: { id: true, name: true, gradeLevel: true, section: true, schoolYear: true } },
      },
      orderBy: [{ student: { lastName: 'asc' } }, { student: { firstName: 'asc' } }],
    });
  }

  async create(dto: CreateEnrollmentDto) {
    // Validate refs
    const [student, cls] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.studentId }, select: { role: true } }),
      this.prisma.schoolClass.findUnique({ where: { id: dto.classId }, select: { id: true } }),
    ]);
    if (!student) throw new BadRequestException('Student not found');
    if (student.role !== Role.Student) throw new BadRequestException('User is not a student');
    if (!cls) throw new BadRequestException('Class not found');

    try {
      return await this.prisma.enrollment.create({
        data: { studentId: dto.studentId, classId: dto.classId, status: EnrollmentStatus.Active },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Student is already enrolled in this class.');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdateEnrollmentDto) {
    try {
      return await this.prisma.enrollment.update({ where: { id }, data: dto });
    } catch {
      throw new NotFoundException(`Enrollment ${id} not found`);
    }
  }
}
