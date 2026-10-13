import {
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { TaskStatus } from 'generated/prisma/enums';


export class UpdateStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @IsOptional()
  @IsString()
  remark?: string;
}