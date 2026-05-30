import { IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

export class CreateClassDto {
  @IsString() @MinLength(1)
  name!: string;            // "Grade 10 - Rizal"

  @IsInt() @Min(7) @Max(12)
  gradeLevel!: number;

  @IsString() @MinLength(1)
  section!: string;

  @IsString() @MinLength(4)
  schoolYear!: string;      // "2025-2026"

  @IsString() @MinLength(1)
  adviserId!: string;
}

export class UpdateClassDto {
  @IsOptional() @IsString() @MinLength(1)
  name?: string;

  @IsOptional() @IsInt() @Min(7) @Max(12)
  gradeLevel?: number;

  @IsOptional() @IsString() @MinLength(1)
  section?: string;

  @IsOptional() @IsString() @MinLength(4)
  schoolYear?: string;

  @IsOptional() @IsString() @MinLength(1)
  adviserId?: string;
}
