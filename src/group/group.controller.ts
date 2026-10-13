import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { Request } from 'express';

import { JwtAuthGuard } from '../auth/auth.guard';


import { CreateGroupDto } from './dto/create-group.dto';
import { GroupService } from './group.service';
import { InviteGroupDto } from './dto/invite-group.dto';
import { ResponseDto } from './dto/response.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
  };
}


@Controller('groups')
@UseGuards(JwtAuthGuard)
export class GroupsController {
  constructor(
    private readonly groupsService: GroupService,
  ) {}

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateGroupDto,
  ) {
    return this.groupsService.create(
      req.user['userId'],
      dto,
    );
  }

  @Get()
  list(@Req() req: AuthenticatedRequest) {
    return this.groupsService.list(
      req.user['userId'],
    );
  }

  @Post(':groupId/invite')
  invite(
    @Req() req: AuthenticatedRequest,
    @Param('groupId') groupId: string,
    @Body() dto: InviteGroupDto,
  ) {
    return this.groupsService.invite(
      req.user['userId'],
      groupId,
      dto,
    );
  }

  @Get('invites')
  myInvites(@Req() req: AuthenticatedRequest) {
    return this.groupsService.myInvites(
      req.user['userId'],
    );
  }

  @Post('invites/:inviteId/respond')
  respond(
    @Req() req: AuthenticatedRequest,
    @Param('inviteId') inviteId: string,
    @Body() dto: ResponseDto,
  ) {
    return this.groupsService.respond(
      req.user['userId'],
      inviteId,
      dto.accept,
    );
  }

  @Get(':groupId/members')
  members(
    @Req() req: AuthenticatedRequest,
    @Param('groupId') groupId: string,
  ) {
    return this.groupsService.member(
      req.user['userId'],
      groupId,
    );
  }
}