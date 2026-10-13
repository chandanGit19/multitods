import { Module } from "@nestjs/common";
import { GroupsController } from "./group.controller";
import { GroupService } from "./group.service";
import { PrimsaService } from "../prisma.service";


@Module({
    imports: [],
    controllers: [GroupsController],
    providers: [GroupService, PrimsaService],
    exports: [GroupService]
})
export class GroupModule{}