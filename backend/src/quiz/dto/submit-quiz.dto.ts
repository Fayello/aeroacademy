import { IsNotEmpty, IsObject } from 'class-validator';

export class SubmitQuizDto {
  @IsNotEmpty({ message: 'Answers are required' })
  @IsObject()
  answers: Record<string, string>;
}
