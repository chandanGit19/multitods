import { IsNotEmpty, IsString } from "class-validator";



export class InviteGroupDto {

   @IsString()
   @IsNotEmpty()
    email!: string

}