import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assume we create this guard

@UseGuards(JwtAuthGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  async create(@Body() body: { name: string; adminId: string; superAdminId: string }) {
    return this.schoolsService.createSchool(body.name, body.adminId, body.superAdminId);
  }

  @Get()
  async findAll() {
    return this.schoolsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }
}
