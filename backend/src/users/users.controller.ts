import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import {
  BulkCreateStudentDto,
  BulkCreateTeacherDto,
  CreateStudentDto,
  CreateTeacherDto,
} from './dto';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/auth.guards';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @Roles(Role.Admin, Role.Teacher)
  findAll(@Query('role') role?: Role) {
    return this.users.findAll(role);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher)
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post('teachers')
  @Roles(Role.Admin)
  createTeacher(@Body() dto: CreateTeacherDto) {
    return this.users.createTeacher(dto);
  }

  @Post('teachers/bulk')
  @Roles(Role.Admin)
  bulkCreateTeachers(@Body() dto: BulkCreateTeacherDto) {
    return this.users.bulkCreateTeachers(dto.rows);
  }

  @Post('students')
  @Roles(Role.Admin, Role.Teacher)
  createStudent(@Body() dto: CreateStudentDto) {
    return this.users.createStudent(dto);
  }

  @Post('students/bulk')
  @Roles(Role.Admin, Role.Teacher)
  bulkCreateStudents(@Body() dto: BulkCreateStudentDto) {
    return this.users.bulkCreateStudents(dto.rows);
  }
}
