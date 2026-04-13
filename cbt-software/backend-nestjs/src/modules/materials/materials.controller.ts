import { Controller, Get, Post, Delete, Body, Param, UseGuards, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MaterialsService } from './materials.service';
import { CreateMaterialDto } from './dto/material.dto';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

@Controller('materials')
@UseGuards(JwtAuthGuard)
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/materials',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() dto: CreateMaterialDto, @Req() req: any) {
    if (!file) throw new BadRequestException('File is required');

    return this.materialsService.create({
      ...dto,
      fileUrl: `/uploads/materials/${file.filename}`,
      fileName: file.originalname,
      uploadedById: req.user.userId,
    });
  }

  @Get('class/:classId')
  async findByClass(@Param('classId') classId: string) {
    return this.materialsService.findByClass(classId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materialsService.findOne(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.materialsService.remove(id);
  }
}
