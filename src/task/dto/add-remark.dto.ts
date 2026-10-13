import {
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class AddRemarkDto {
  @IsString()
  @IsNotEmpty()
  remark!: string;
}