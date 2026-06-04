import { IsNumber, IsOptional, IsString, MinLength, IsPositive } from 'class-validator';

export class CreateSubjectDto {
  @IsString() @MinLength(1)
  code!: string;            // e.g. "MATH10"

  @IsString() @MinLength(1)
  name!: string;            // e.g. "Mathematics 10"

  @IsString() @MinLength(1)
  classId!: string;

  // Teacher self-create: omit and we'll default to the requester.
  // Admin: pass explicitly to assign to a specific teacher.
  @IsOptional() @IsString() @MinLength(1)
  teacherId?: string;

  @IsOptional() @IsNumber() @IsPositive()
  units?: number;
}

export class UpdateSubjectDto {
  @IsOptional() @IsString() @MinLength(1)
  code?: string;

  @IsOptional() @IsString() @MinLength(1)
  name?: string;

  @IsOptional() @IsString() @MinLength(1)
  classId?: string;

  @IsOptional() @IsString() @MinLength(1)
  teacherId?: string;

  @IsOptional() @IsNumber() @IsPositive()
  units?: number;
}
