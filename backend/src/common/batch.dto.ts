import {
  IsArray,
  IsIn,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BatchIdsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];
}

export class BatchStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];

  @IsIn(['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'])
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
}

export class BatchRoleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsString({ each: true })
  ids: string[];

  @IsIn(['STUDENT', 'ADMIN', 'RECRUITER'])
  role: 'STUDENT' | 'ADMIN' | 'RECRUITER';
}

export class BatchLabStopItemDto {
  @IsString()
  labId: string;

  @IsString()
  userId: string;
}

export class BatchLabStopDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => BatchLabStopItemDto)
  items: BatchLabStopItemDto[];
}
