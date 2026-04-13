import { IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateMaterialDto {
  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  classId!: string;

  @IsString()
  @IsOptional()
  subject?: string;
}
