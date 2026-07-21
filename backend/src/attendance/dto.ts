import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceEntryDto {
  @IsString() @MinLength(1)
  studentId!: string;

  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @IsOptional() @IsString()
  remarks?: string;
}

/** Bulk mark/update attendance for a subject on a given date. */
export class MarkAttendanceDto {
  @IsString() @MinLength(1)
  subjectId!: string;

  @IsDateString()
  date!: string; // "YYYY-MM-DD"

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  entries!: AttendanceEntryDto[];
}
