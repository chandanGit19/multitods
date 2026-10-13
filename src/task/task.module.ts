import { Module } from '@nestjs/common';

import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { PrimsaService } from 'src/prisma.service';
import { GroupModule } from 'src/group/group.module';
import { RealtimeModule } from 'src/realtime/realtime.module';


@Module({
  imports: [
    GroupModule,
    RealtimeModule,
  ],

  controllers: [
    TaskController,
  ],

  providers: [
    TaskService,
    PrimsaService,
  ],
})
export class TasksModule {}