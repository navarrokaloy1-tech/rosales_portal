import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @IsString() @MinLength(1)
  studentId!: string;

  @IsString() @MinLength(1)
  classId!: string;
}

export class UpdateEnrollmentDto {
  @IsOptional() @IsEnum(EnrollmentStatus)
  status?: EnrollmentStatus;
}
