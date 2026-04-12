import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.email, body.password);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body.name, body.email, body.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req: any, @Body() body: any) {
    return this.authService.changePassword(req.user.userId, body.currentPassword, body.newPassword);
  }

  @Post('verify-token')
  async verifyToken(@Body('token') token: string) {
    return this.authService.verifyToken(token);
  }

  @Post('logout')
  async logout() {
    return { success: true };
  }

  @Post('refresh')
  async refresh() {
    // Basic implementation for now, returning success
    return { success: true };
  }
}
