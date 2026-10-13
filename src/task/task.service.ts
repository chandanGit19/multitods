import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { GroupService } from "src/group/group.service";
import { PrimsaService } from "../prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { TaskEventType, TaskStatus } from "generated/prisma/enums";
import { RealtimeGateWay } from "../realtime/realtime.gateway";



@Injectable()
export class TaskService {


    constructor(

        private readonly prismaService :PrimsaService,
        private readonly groupservice :GroupService,
        private readonly realtime: RealtimeGateWay

    ){

    }


    async create(userId: string, groupId: string, dto: CreateTaskDto){

        await this.groupservice.assertMember(
            groupId, userId
        )

        const assignee = await this.prismaService.groupMember.findUnique({
            where:{
                userId_groupId:{
                    userId,
                    groupId
                }
            }
        })

        if(!assignee){
            throw new BadRequestException("Assigne User is not a member of this group")
        }

        const task = await this.prismaService.$transaction(async (tx)=>{
            const create = await tx.task.create({
                data:{
                    groupId,
                    title: dto.title,
                    description: dto.description,
                    createdById: userId,
                    dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined
                },

                include:{
                    User_Task_assignedToIdToUser: {
                        select:{
                            id: true,
                            email: true,
                            name: true
                        }
                    },

                    User_Task_createdByIdToUser:{
                         select:{
                            id: true,
                            email: true,
                            name: true
                        }
                    }
                }

            })

            await tx.taskEvent.create({
                data:{
                    taskId: create.id,
                    actorId: userId,
                    type: TaskEventType.CREATED,
                    remark: "something"
                }
            })

            return create
        })

        this.realtime.emitToGroup(
            groupId,
            'task.create',
            task
        )

        this.realtime.emitToUser(
            dto.assignedId,
            'task.assigned',
            task
        )

        return task

    }



    async list(userId: string, groupId: string){

      await  this.groupservice.assertMember(
            groupId,
            userId
        )

        return this.prismaService.task.findMany({
            where:{
                groupId: groupId
            },

            include: {
                User_Task_assignedToIdToUser: {
                    select:{
                        id: true,
                        name: true,
                        email: true
                    }
                },

                User_Task_createdByIdToUser:{
                    select:{
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },

            orderBy:{
                createdAt: "desc"
            }
        })

    }

    async getOne(userId: string, groupId: string, taskId: string){
        await this.groupservice.assertMember(
            groupId, userId
        )

        const task = await this.prismaService.task.findFirst({
            where:{
                id: taskId
            },

            include:{
                User_Task_assignedToIdToUser:{
                    select:{
                        id: true,
                        name: true,
                        email: true
                    }
                },
                User_Task_createdByIdToUser:{
                    select:{
                        id: true,
                        name: true,
                        email: true
                    }
                },

                TaskEvent:{
                    include:{
                        User:{
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },

                    orderBy:{
                        createdAt: "asc"
                    }
                }

            }
        })
    
         if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    return task
    
    }


    async updateStatus(userId: string, groupId: string, taskId: string, status: TaskStatus, remark?: string){

        await this.groupservice.assertMember(groupId, userId)

        const task = await this.prismaService.task.findFirst({
            where:{
                id: taskId,
                groupId
            }
        })

        if(!task){
            throw new BadRequestException("Task not found")
        }

        const now = new Date();

        let eventType: | TaskEventType | undefined

        const updateData: any = {
            status,
        }

        if(status == TaskStatus.IN_PROGRESS){
            eventType = TaskEventType.ASSIGNED

            updateData.pickedUpAt = task.pickedUpAt || now
        }

        if(status == TaskStatus.COMPLETED){
            eventType =
        TaskEventType.COMPLETED;

      updateData.completedAt = now;
        }

          if (
      status === TaskStatus.CANCELLED
    ) {
      eventType =
        TaskEventType.CANCELLED;
    }

    if (
      status === TaskStatus.TODO &&
      task.status ===
        TaskStatus.COMPLETED
    ) {
      eventType =
        TaskEventType.REOPENED;

      updateData.completedAt = null;
    }


    const update = await this.prismaService.$transaction(async (tx)=>{

        const result = await tx.task.update({
            where:{
                id: taskId
            },
            data:updateData,
            
            include:{
                User_Task_assignedToIdToUser: {
                    select:{
                        id: true,
                        name: true,
                        email: true
                    }
                },

                User_Task_createdByIdToUser:{
                    select:{
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        })

         if (eventType) {
            await tx.taskEvent.create({
              data: {
                taskId,
                actorId: userId,
                type: eventType,
                remark : remark || "this is remal",
              },
            });
          }

          if (remark) {
            await tx.taskEvent.create({
              data: {
                taskId,
                actorId: userId,
                type: TaskEventType.REMARK_ADDED,
                remark,
              },
            });

    
        }

        return result
    
    
    })



    this.realtime.emitToGroup(
      groupId,
      'task.updated',
      update,
    );

    return update;
    }



    async addRemark(
    userId: string,
    groupId: string,
    taskId: string,
    remark: string,
  ) {
    await this.groupservice.assertMember(
      groupId,
      userId,
    );

    const task =
      await this.prismaService.task.findFirst({
        where: {
          id: taskId,
          groupId,
        },
      });

    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    const event =
      await this.prismaService.taskEvent.create({
        data: {
          taskId,
          actorId: userId,
          type: TaskEventType.REMARK_ADDED,
          remark,
        },

        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

    this.realtime.emitToGroup(
      groupId,
      'task.remark_added',
      {
        taskId,
        event,
      },
    );

    return event;
  }

  async history(
    userId: string,
    groupId: string,
    taskId: string,
  ) {
    await this.groupservice.assertMember(
      groupId,
      userId,
    );

    const task =
      await this.prismaService.task.findFirst({
        where: {
          id: taskId,
          groupId,
        },
      });

    if (!task) {
      throw new NotFoundException(
        'Task not found',
      );
    }

    return this.prismaService.taskEvent.findMany({
      where: {
        taskId,
      },

      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: 'asc',
      },
    });
  }



}