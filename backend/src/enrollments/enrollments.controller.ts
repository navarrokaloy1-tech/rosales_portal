import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto, UpdateEnrollmentDto } from './dto';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/auth.guards';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Get()
  @Roles(Role.Admin, Role.Teacher)
  list(@Query('classId') classId?: string, @Query('studentId') studentId?: string) {
    return this.enrollments.list(classId, studentId);
  }

  @Post()
  @Roles(Role.Admin, Role.Teacher)
  create(@Body() dto: CreateEnrollmentDto) {
    return this.enrollments.create(dto);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.enrollments.update(id, dto);
  }
}
