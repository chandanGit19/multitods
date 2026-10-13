import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import {JwtService} from "@nestjs/jwt"
import { PrimsaService } from 'src/prisma.service';

import * as bcrypt from 'bcrypt';


@Injectable()
export class AuthService {

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrimsaService

  ){}


 async register(registerDto: RegisterDto) {
    // return 'This action adds a new auth';
    
    const email = registerDto.email.toLocaleLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where :{
        email: email
      }
    })

    if(existingUser){
      throw new ConflictException("Email already register")
    }

    const hashPassword = await bcrypt.hash(registerDto.password, 10)

    const user = await this.prisma.user.create({
      data: {
        email, 
        passwordHash: hashPassword,
        name: registerDto.name
      }
    })

    return {
      user : this.sanitizeUser(user),
      accessToken: this.generateToken(user.id)
    }


  }

   async login(loginDto: LoginDto){

    const email = loginDto.email.toLocaleLowerCase().trim()

    const user  = await this.prisma.user.findUnique({
      where: {
        email: email
      }
    })

    if(!user){
      throw new UnauthorizedException("Please provide valid email and passoword")
    }

    const comparePassword = await bcrypt.compare(loginDto.password, user.passwordHash)

    if(!comparePassword){
      throw new UnauthorizedException("PLease provide valid email and password")
    }

    return {
      user : this.sanitizeUser(user),
      accessToken: this.generateToken(user.id)
    }

   }


   async validateUser (UserId: string){
    return this.prisma.user.findUnique({
      where: {
        id: UserId
      },
      select :{
        id: true,
        name: true,
        email: true
      }
    })
          
   }


  private generateToken (userId: any){
    return this.jwtService.sign({
      sub: userId
    })
  }

  private sanitizeUser (user: any){
    return {
      id: user.id,
      name: user.name,
      email: user.email
    }
  }

}

