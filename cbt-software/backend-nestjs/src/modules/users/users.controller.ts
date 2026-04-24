import { Body, Controller, Get, Param, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async search(@Query('email') email: string) {
    const users = await this.usersService.searchByEmail(email || '');
    return { users: users.map((u: any) => ({ ...u, _id: u.id })) };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    if (!user) return { user: null };
    return { user: { ...user, _id: user.id } };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const updated = await this.usersService.updateProfile(id, body);
    return { message: 'User updated', user: { ...updated, _id: updated.id } };
  }
}

