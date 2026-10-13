import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "../generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg"
import "dotenv/config"
// import { readFileSync } from "fs";

import { readFileSync } from "node:fs";
import { join } from "node:path";



@Injectable()
export class PrimsaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

    constructor(){
     
        super({
            adapter: new PrismaPg({
                connectionString: process.env.DATABASE_URL!,
                ssl:{
                    rejectUnauthorized: true,
                    // ca: readFileSync("certs/ca.pem").toString()
                ca: readFileSync(
                            join(process.cwd(), "certs", "ca.pem"),
                            "utf8"
                            )
                }
            })
        })
         
    }

    async onModuleInit() {
        await this.$connect()
    }

   async onModuleDestroy() {
        await this.$disconnect()
    }

}