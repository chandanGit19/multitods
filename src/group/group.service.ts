import {BadRequestException, ForbiddenException, Injectable, NotFoundException} from "@nestjs/common"
import { CreateGroupDto } from "./dto/create-group.dto";
import { PrimsaService } from "src/prisma.service";
import { GroupInviteStatus, GroupRole } from "generated/prisma/enums";
import { InviteGroupDto } from "./dto/invite-group.dto";

@Injectable()
export class GroupService{


    constructor(

        private readonly prismaService: PrimsaService
    ){

    }
async create(
    userId: string,
    dto: CreateGroupDto,
  ) {
    return this.prismaService.group.create({
      data: {
        name: dto.name,

        GroupMember: {
          create: {
            userId,
            role: GroupRole.OWNER,
          },
        },
      },

      include: {
        GroupMember: {
          include: {
            User: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }
  
  async list(userId: string){
      return this.prismaService.group.findMany({
        where:{
            GroupMember:{
                some :{
                    userId
                }
            }
        },

        include: {
            GroupMember:{
                include: {
                    User:{
                        select:{
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                }
            },

            _count:{
                select:{
                    Task: true
                },
            },
        },

        orderBy:{
            createdAt: "desc"
        }
      })
  }

  async invite(userId: string, groupId: string, dto: InviteGroupDto){

    // await this.assertMember(
    //   groupId,
    //   userId,
    // );

    const email = dto.email.toLowerCase().trim()

    const invitee = await this.prismaService.user.findUnique({
        where:{
            email
        }

    })
    
    if(!invitee){
        throw new NotFoundException("Please provide a valide user email")
    } 

    if(invitee.id == userId){
        throw new BadRequestException("Can not invite self")
    }

    const alreadyMember = await this.prismaService.groupMember.findUnique({
        where:{
           userId_groupId:{
            userId: invitee.id,
            groupId
           }
        }
    })

    if(alreadyMember){
        throw new BadRequestException("User is already memeber of the group")
    }

    const existing = await this.prismaService.groupInvite.findFirst({
        where:{
            groupId,
            inviteedId: invitee.id,
            status: GroupInviteStatus.PENDING
        }
    })

    if(existing){
        throw new BadRequestException("User is already invited")
    }

    return this.prismaService.groupInvite.create({
        data:{
            groupId,
            inviteedId: invitee.id,
            inviterId: userId
        },

        include:{
            Group: true,

            User_GroupInvite_inviterIdToUser:{
                select:{
                    id: true,
                    name: true,
                    email: true
                }
            },

            User_GroupInvite_inviteedIdToUser:{
                select:{
                    id:true,
                    email:true,
                    name: true
                }
            }
        }
    })

  }


  async myInvites(userId: string){

    return this.prismaService.groupInvite.findMany({
        where:{
            inviteedId: userId,
            status: GroupInviteStatus.PENDING
        },

        include:{
            Group: true,

            User_GroupInvite_inviterIdToUser: {
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


  async respond(userId: string, invitedId: string, accept: boolean){

    const invite =  await this.prismaService.groupInvite.findUnique({
        where:{
            id: invitedId
        }
    })

    if(!invite || invite.inviteedId != userId){
        throw new BadRequestException("Invitation not found")
    }

    if(invite && invite.status != "PENDING"){
        throw new BadRequestException("Invitation is no longer exist")
    }

    if(!accept){
        return this.prismaService.groupInvite.update({
            where:{
                id: invitedId
            },

            data:{
                status : GroupInviteStatus.REJECTED,
                respondedAt: new Date(),
            }
        })
    }

 
    return this.prismaService.$transaction(async (tx)=>{
 
        await tx.groupMember.create({
            data:{
                userId: userId,
                groupId: invite.groupId,
                role: GroupRole.MEMBER 
            }
        })
 
         return tx.groupInvite.update({
            where:{
                id: invitedId
            },
            data:{
                status: GroupInviteStatus.ACCEPTED,
                respondedAt: new Date()
            }
         })
 
    })

  }



  async member(userId: string , groupId: string){

    return this.prismaService.groupMember.findMany({
        where:{
            groupId: groupId
        },

        include: {
            User:{
                select:{
                    id: true,
                    name: true,
                    email: true
                }
            }
        },

        orderBy:{
            joindAt: "asc"
        }
    })

  }

   async assertMember(
    groupId: string,
    userId: string,
  ) {
    const member =
      await this.prismaService.groupMember.findUnique({
        where: {
          userId_groupId: {
            groupId,
            userId,
          },
        },
      });

    if (!member) {
      throw new ForbiddenException(
        'You are not a member of this group',
      );
    }

    return member;
  }

}