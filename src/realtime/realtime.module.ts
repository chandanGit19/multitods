import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { ConfigModule, ConfigService } from '@nestjs/config';


import { PrimsaService } from '../prisma.service';
import { RealtimeGateWay } from './realtime.gateway';

@Module({
  imports: [
    ConfigModule,

    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (
        configService: ConfigService,
      ) => ({
        secret:
          configService.get<string>(
            'JWT_SECRET',
          ) || 'dev-secret',
      }),
    }),
  ],

  providers: [
    RealtimeGateWay,
    PrimsaService,
  ],

  exports: [
    RealtimeGateWay,
  ],
})
export class RealtimeModule {}