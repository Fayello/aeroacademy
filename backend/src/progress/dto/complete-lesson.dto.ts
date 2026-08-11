import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteLessonDto {
  @IsNotEmpty({ message: 'Lesson ID is required' })
  @IsString()
  lessonId: string;
}
