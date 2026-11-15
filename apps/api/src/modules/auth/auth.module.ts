import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { User } from '../user/entities/user.entity.js';
import { Admin } from '../admin/entities/admin.entity.js';
import { EmailCode } from './entities/email-code.entity.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Admin, EmailCode]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret') as string,
        signOptions: {
          expiresIn: config.get<string>('jwt.accessExpiresIn') || '2h',
        } as any,
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
