import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { Designer } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

export interface AuthTokenResponse {
  accessToken: string;
  designer: Omit<Designer, never>;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokenResponse> {
    const existing = await this.prisma.userAccount.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const designer = await this.prisma.$transaction(async (tx) => {
      const newDesigner = await tx.designer.create({
        data: {
          name: dto.name,
          businessName: dto.businessName,
          email: dto.email,
          phone: dto.phone,
          address: dto.address,
        },
      });

      await tx.userAccount.create({
        data: {
          designerId: newDesigner.id,
          email: dto.email,
          passwordHash,
          isVerified: false,
        },
      });

      return newDesigner;
    });

    this.logger.log(`New designer registered: ${designer.email}`);
    return this.buildTokenResponse(designer);
  }

  async validateDesigner(email: string, password: string): Promise<Designer | null> {
    const account = await this.prisma.userAccount.findUnique({
      where: { email },
      include: { designer: true },
    });

    if (!account) return null;

    const isMatch = await bcrypt.compare(password, account.passwordHash);
    if (!isMatch) return null;

    return account.designer;
  }

  async login(designer: Designer): Promise<AuthTokenResponse> {
    this.logger.log(`Designer logged in: ${designer.email}`);
    return this.buildTokenResponse(designer);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string; resetToken: string }> {
    const account = await this.prisma.userAccount.findUnique({
      where: { email: dto.email },
    });

    // Return success even if not found to prevent email enumeration
    if (!account) {
      return {
        message: 'If an account exists, a reset token has been issued',
        resetToken: '',
      };
    }

    const resetToken = uuidv4();
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.userAccount.update({
      where: { id: account.id },
      data: {
        passwordResetToken: resetTokenHash,
        passwordResetExpiry: expiry,
      },
    });

    this.logger.log(`Password reset token issued for: ${dto.email}`);

    return {
      message: 'Password reset token generated (in production this would be emailed)',
      resetToken, // plain token returned for demo; production would email it
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const accounts = await this.prisma.userAccount.findMany({
      where: {
        passwordResetExpiry: { gte: new Date() },
      },
    });

    let matchedAccount = null;
    for (const account of accounts) {
      if (!account.passwordResetToken) continue;
      const matches = await bcrypt.compare(dto.token, account.passwordResetToken);
      if (matches) {
        matchedAccount = account;
        break;
      }
    }

    if (!matchedAccount) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.userAccount.update({
      where: { id: matchedAccount.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    this.logger.log(`Password reset successfully for account: ${matchedAccount.email}`);
    return { message: 'Password has been reset successfully' };
  }

  async getProfile(designerId: string): Promise<Designer> {
    const designer = await this.prisma.designer.findUnique({
      where: { id: designerId },
    });

    if (!designer) {
      throw new NotFoundException('Designer not found');
    }

    return designer;
  }

  async updateProfile(
    designerId: string,
    updates: Partial<Pick<Designer, 'name' | 'businessName' | 'phone' | 'address' | 'logoUrl' | 'currency' | 'currencySymbol' | 'whatsappPhoneNumberId' | 'whatsappAccessToken' | 'whatsappSandboxMode' | 'messageSignature'>>,
  ): Promise<Designer> {
    return this.prisma.designer.update({
      where: { id: designerId },
      data: updates,
    });
  }

  private buildTokenResponse(designer: Designer): AuthTokenResponse {
    const payload = { sub: designer.id, email: designer.email };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get<string>('jwt.expiresIn') ?? '7d',
    });

    return { accessToken, designer };
  }
}
