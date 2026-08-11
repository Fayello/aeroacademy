import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class SubmitFlagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  answer: string;
}
