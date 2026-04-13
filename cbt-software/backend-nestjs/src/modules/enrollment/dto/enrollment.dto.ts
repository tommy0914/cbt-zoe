import { IsUUID, IsEnum, IsOptional, IsString } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentRequestDto {
  @IsUUID()
  classId!: string;
}

export class HandleEnrollmentRequestDto {
  @IsEnum(EnrollmentStatus)
  status!: EnrollmentStatus;

  @IsString()
  @IsOptional()
  reason?: string;
}
