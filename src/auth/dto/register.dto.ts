import {IsNotEmpty, isString, IsString, MinLength} from "class-validator"


export class RegisterDto {
    
    @IsString()
    @IsNotEmpty()
    name!: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password!: string;


    @IsString()
    @IsNotEmpty()
    email!: string

}