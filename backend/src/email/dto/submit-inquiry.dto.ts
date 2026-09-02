import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitInquiryDto {
  @IsIn(['university', 'enterprise'])
  inquiryType: 'university' | 'enterprise';

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @IsEmail()
  @MaxLength(160)
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  organization: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  teamSize?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  phone?: string;

  @IsString()
  @MinLength(20)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  sourcePage?: string;
}
