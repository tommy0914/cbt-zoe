import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  private async buildTokenPair(user: any) {
    const accessPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId || null,
      type: 'access',
    };
    const refreshPayload = {
      sub: user.id,
      email: user.email,
      type: 'refresh',
    };

    const accessToken = await this.jwtService.signAsync(accessPayload, {
      secret: process.env.JWT_SECRET || 'fallback_secret',
      expiresIn: '24h', // Increased for testing convenience
    });
    const refreshToken = await this.jwtService.signAsync(refreshPayload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback_secret',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private normalizeAuthUser(user: any) {
    const { password, ...safe } = user;
    const schools = (safe.schoolRoles || []).map((r: any) => ({
      schoolId: r.schoolId,
      role: r.role,
    }));
    return { ...safe, _id: safe.id, schools };
  }

  async login(email: string, pass: string) {
    const loginIdentifier = email?.toLowerCase().trim();
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: loginIdentifier }, { username: loginIdentifier }],
      },
      include: { schoolRoles: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      const minutesRemaining = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 60000);
      throw new UnauthorizedException(`Account is temporarily locked. Try again in ${minutesRemaining} minutes.`);
    }

    const validPassword = await bcrypt.compare(pass, user.password);
    if (!validPassword) {
      const nextAttempts = (user.loginAttempts || 0) + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: nextAttempts,
          lockUntil: nextAttempts >= 5 ? new Date(Date.now() + 30 * 60 * 1000) : null,
        },
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockUntil: null,
        lastLogin: new Date(),
      },
    });
    const freshUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { schoolRoles: true },
    });
    if (freshUser) {
      const { accessToken, refreshToken } = await this.buildTokenPair(freshUser);
      return {
        success: true,
        token: accessToken,
        accessToken,
        refreshToken,
        userId: freshUser.id,
        user: this.normalizeAuthUser(freshUser),
        expiresIn: 86400, // 24 hours in seconds
      };
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async register(name: string, email: string, pass: string) {
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.student, // Default role
      },
      include: { schoolRoles: true },
    });

    const { accessToken, refreshToken } = await this.buildTokenPair(user);

    return {
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      userId: user.id,
      user: this.normalizeAuthUser(user),
      expiresIn: 86400,
    };
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !(await bcrypt.compare(currentPass, user.password))) {
      throw new UnauthorizedException('Invalid current password');
    }

    const hashedPassword = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  async verifyToken(token: string) {
    try {
      await this.jwtService.verifyAsync(token);
      return { valid: true };
    } catch {
      return { valid: false };
    }
  }

  async refreshToken(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    let decoded: any;
    try {
      decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'fallback_secret',
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (decoded?.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({ where: { id: decoded.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const pair = await this.buildTokenPair(user);
    return {
      success: true,
      token: pair.accessToken,
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      expiresIn: 86400,
    };
  }
}
