import { IsBoolean } from "class-validator";



export class ResponseDto {

    @IsBoolean()
    accept!: boolean

}