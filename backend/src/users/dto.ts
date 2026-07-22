import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsHexColor,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateTeacherDto {
  @IsString() @MinLength(1)
  employeeId!: string;

  @IsString() @MinLength(1)
  firstName!: string;

  @IsString() @MinLength(1)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsHexColor()
  avatarColor?: string;
}

export class BulkCreateTeacherDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => CreateTeacherDto)
  rows!: CreateTeacherDto[];
}

export class CreateStudentDto {
  @IsString() @MinLength(1)
  studentId!: string; // school-issued student number, also default password

  @IsOptional() @IsString()
  lrn?: string;

  @IsString() @MinLength(1)
  firstName!: string;

  @IsString() @MinLength(1)
  lastName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsHexColor()
  avatarColor?: string;
}

export class BulkCreateStudentDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => CreateStudentDto)
  rows!: CreateStudentDto[];
}
