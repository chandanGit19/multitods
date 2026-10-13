import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";



export class CreateTaskDto {

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    title!: string


    @IsNotEmpty()
    @IsString()
    description?: string

    @IsUUID()
    assignedId!: string

    @IsOptional()
    @IsDateString()
    dueAt?: string


}