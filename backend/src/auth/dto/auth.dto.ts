import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])/, {
    message: 'Password must contain at least one lowercase letter',
  })
  @Matches(/^(?=.*[A-Z])/, {
    message: 'Password must contain at least one uppercase letter',
  })
  @Matches(/^(?=.*\d)/, {
    message: 'Password must contain at least one number',
  })
  password: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  timezone?: string;
}

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string;
}

export class UpdateProfileDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  username?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsString()
  @IsOptional()
  userExperience?: string;

  @IsBoolean()
  @IsOptional()
  onboardingCompleted?: boolean;

  @IsObject()
  @IsOptional()
  onboardingSelections?: Record<string, unknown>;
}

export class ChangePasswordDto {
  @IsNotEmpty()
  oldPassword: string;

  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(8, { message: 'New password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])/, {
    message: 'New password must contain at least one lowercase letter',
  })
  @Matches(/^(?=.*[A-Z])/, {
    message: 'New password must contain at least one uppercase letter',
  })
  @Matches(/^(?=.*\d)/, {
    message: 'New password must contain at least one number',
  })
  newPassword: string;
}
