import { ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

import {ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer} from "@nestjs/websockets"
import { PrimsaService } from "src/prisma.service";

import {Socket, Server} from "socket.io";



@WebSocketGateway({
    namespace: "/realtime",

    cors: {
        origin: "*"
    }
})
@Injectable()
export class RealtimeGateWay implements OnGatewayConnection, OnGatewayDisconnect{

    @WebSocketServer()
    server!: Server

    constructor (
        private readonly prismaService: PrimsaService,
        private readonly jwtService: JwtService

    ){}

    async handleConnection(client: Socket
    ) {
        
        try{

            const token = client.handshake.auth?.token || client.handshake.headers.authorization?.replace("Bearer ","")

            if(!token){
                throw new UnauthorizedException("Token require")
            }

            const payload =await this.jwtService.verify<{sub: string}>(token)

            client.data.userId = payload.sub

            await client.join(
                this.userRoom(payload.sub)
            )

            client.emit("connected", {
                userId: payload.sub
            })

             console.log(
        `WebSocket connected: ${payload.sub}`,
      );

        }catch(error){

            console.log(
        'WebSocket authentication failed',
      );

      client.emit('ws.error', {
        message: 'Unauthorized',
      });

      client.disconnect();

        }
    }

      handleDisconnect(
    client: Socket,
  ) {
    console.log(
      `WebSocket disconnected: ${client.data.userId}`,
    );
  }

  @SubscribeMessage('group.join')
  async joinGroup(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: {
        groupId: string
    },
  ){

    const userId = client.data.userId

    if(!userId){
        throw new UnauthorizedException("wrong userId socket")
    }

    const member = await this.prismaService.groupMember.findUnique({
        where:{
            userId_groupId:{
                userId,
                groupId: data.groupId
            }
        }
    })

    if(!member){
        throw new ForbiddenException("You are not a member of this group")
    }

    await client.join(
        this.groupRoom(
            data.groupId
        )
    )

    client.emit('group.joined',{
            groupId: data.groupId
    })

    return {
        success: true,
        groupId: data.groupId
    }

  }

   @SubscribeMessage('group.leave')
  async leaveGroup(
    @ConnectedSocket()
    client: Socket,

    @MessageBody()
    data: {
      groupId: string;
    },
  ) {
    await client.leave(
      this.groupRoom(
        data.groupId,
      ),
    );

    client.emit(
      'group.left',
      {
        groupId: data.groupId,
      },
    );

    return {
      success: true,
    };
  }

  emitToGroup(
    groupId: string,
    event: string,
    payload: any,
  ) {
    this.server
      .to(this.groupRoom(groupId))
      .emit(event, payload);
  }

  emitToUser(
    userId: string,
    event: string,
    payload: any,
  ) {
    this.server
      .to(this.userRoom(userId))
      .emit(event, payload);
  }

  private groupRoom(
    groupId: string,
  ) {
    return `group:${groupId}`;
  }

  private userRoom(
    userId: string,
  ) {
    return `user:${userId}`;
  }

}