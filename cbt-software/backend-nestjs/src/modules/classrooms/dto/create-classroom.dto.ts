import { IsString, IsArray, IsOptional, IsUUID } from 'class-validator';

export class CreateClassroomDto {
  @IsString()
  name!: string;

  @IsUUID()
  @IsOptional()
  schoolId!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjects?: string[];

  @IsUUID()
  @IsOptional()
  teacherId?: string;
}
