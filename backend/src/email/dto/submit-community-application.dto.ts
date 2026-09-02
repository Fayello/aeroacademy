import {
  IsArray,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SubmitCommunityApplicationDto {
  @IsIn(['ambassador', 'volunteer'])
  programType: 'ambassador' | 'volunteer';

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  organization?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  experience?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  interests?: string[];

  @IsString()
  @MinLength(30)
  @MaxLength(2000)
  contribution: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  availability?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  portfolioUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourcePage?: string;
}
