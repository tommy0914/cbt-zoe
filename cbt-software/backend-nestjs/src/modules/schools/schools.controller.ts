import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Assume we create this guard

@UseGuards(JwtAuthGuard)
@Controller('schools')
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Post()
  async create(@Body() body: { name: string; adminId: string; superAdminId: string }) {
    const school = await this.schoolsService.createSchool(body.name, body.adminId, body.superAdminId || body.adminId);
    return { school: { ...school, _id: school.id } };
  }

  @Post('create-direct')
  async createDirect(@Body() body: { name: string }, @Req() req: any) {
    const school = await this.schoolsService.createDirect(body.name, req.user.userId);
    return { success: true, school: { ...school, _id: school.id } };
  }

  @Post(':id/join')
  async join(@Param('id') id: string, @Req() req: any) {
    const user = await this.schoolsService.joinSchool(id, req.user.userId);
    return { success: true, user: { ...user, _id: user.id } };
  }

  @Get()
  async findAll() {
    const schools = await this.schoolsService.findAll();
    return { schools: schools.map((s: any) => ({ ...s, _id: s.id })) };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const school = await this.schoolsService.findOne(id);
    return { school: school ? { ...school, _id: school.id } : null };
  }
}
