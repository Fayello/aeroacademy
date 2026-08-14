import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SubmitFlagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  answer: string;
}
