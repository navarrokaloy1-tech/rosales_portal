import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto } from './dto';
import { JwtAuthGuard, Roles, RolesGuard } from '../auth/auth.guards';

interface AuthedRequest {
  user: { id: string; role: Role };
}

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get()
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  list(
    @Req() req: AuthedRequest,
    @Query('subjectId') subjectId?: string,
    @Query('studentId') studentId?: string,
    @Query('date') date?: string,
  ) {
    return this.attendance.list(req.user, { subjectId, studentId, date });
  }

  @Get('summary')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  summary(@Req() req: AuthedRequest, @Query('studentId') studentId?: string) {
    return this.attendance.summary(req.user, studentId);
  }

  @Post()
  @Roles(Role.Admin, Role.Teacher)
  mark(@Body() dto: MarkAttendanceDto, @Req() req: AuthedRequest) {
    return this.attendance.mark(req.user, dto);
  }
}
