import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateStudentDto, CreateTeacherDto } from './dto';
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

  @Post('students')
  @Roles(Role.Admin)
  createStudent(@Body() dto: CreateStudentDto) {
    return this.users.createStudent(dto);
  }
}
