import { IsEmail, IsHexColor, IsOptional, IsString, MinLength } from 'class-validator';

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
