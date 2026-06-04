import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { SubjectsService } from './subjects.service';
import { CreateSubjectDto, UpdateSubjectDto } from './dto';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/auth.guards';

interface AuthedRequest { user: { id: string; role: Role } }

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectsController {
  constructor(private readonly subjects: SubjectsService) {}

  @Get()
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  findAll(@Query('classId') classId?: string, @Query('teacherId') teacherId?: string) {
    return this.subjects.findAll({ classId, teacherId });
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  findOne(@Param('id') id: string) {
    return this.subjects.findOne(id);
  }

  @Post()
  @Roles(Role.Admin, Role.Teacher)
  create(@Body() dto: CreateSubjectDto, @Req() req: AuthedRequest) {
    return this.subjects.create(dto, req.user);
  }

  @Patch(':id')
  @Roles(Role.Admin, Role.Teacher)
  update(@Param('id') id: string, @Body() dto: UpdateSubjectDto, @Req() req: AuthedRequest) {
    return this.subjects.update(id, dto, req.user);
  }

  @Delete(':id')
  @Roles(Role.Admin, Role.Teacher)
  delete(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.subjects.delete(id, req.user);
  }
}
