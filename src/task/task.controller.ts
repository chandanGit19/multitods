import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/auth.guard";
import { TaskService } from "./task.service";

import { Request } from "express";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateStatusDto } from "./dto/update-status.dto";
import { AddRemarkDto } from "./dto/add-remark.dto";


interface AuthenticatedRequest extends Request {
   user: {
    userId: string
   }
}

@Controller('groups/:groupId/tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {

    constructor(
        private readonly taskService: TaskService
    ){
    }

    @Post()
    create(
        @Req() req: AuthenticatedRequest,
        @Param("groupId") groupId: string,
        @Body() dto: CreateTaskDto 
    ){

        return this.taskService.create(
            req.user["userId"],
            groupId,
            dto
        )

    }

    @Get()
    list(
        @Req() req: AuthenticatedRequest,
        @Param("groupId") groupId: string
    ){
        return this.taskService.list(
            req.user["userId"],
            groupId
        )
    }

    @Get(':taskId')
    getOne(
        @Req() req: AuthenticatedRequest,
        @Param('groupId') groupId: string,
        @Param('taskId') taskId: string
    ){

        return this.taskService.getOne(
            req.user["userId"],
            groupId,
            taskId
        )
    }

     @Post(':taskId/status')
    updateStatus(
        @Req() req: AuthenticatedRequest,
        @Param('groupId') groupId: string,
        @Param('taskId') taskId: string,
        @Body() dto: UpdateStatusDto,
    ) {
        return this.taskService.updateStatus(
        req.user['userId'],
        groupId,
        taskId,
        dto.status,
        dto.remark,
        );
    }

     @Post(':taskId/remarks')
    addRemark(
        @Req() req: AuthenticatedRequest,
        @Param('groupId') groupId: string,
        @Param('taskId') taskId: string,
        @Body() dto: AddRemarkDto,
    ) {
        return this.taskService.addRemark(
        req.user['userId'],
        groupId,
        taskId,
        dto.remark,
        );
    }

      @Get(':taskId/history')
    history(
        @Req() req: AuthenticatedRequest,
        @Param('groupId') groupId: string,
        @Param('taskId') taskId: string,
    ) {
        return this.taskService.history(
        req.user['userId'],
        groupId,
        taskId,
        );
    }



}