import {
  IsArray,
  IsIn,
  IsString,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Role } from '@prisma/client';

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

  @IsIn(Object.values(Role))
  role: Role;
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
