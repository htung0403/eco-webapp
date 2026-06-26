import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export const MANIFEST_KANBAN_STATUSES = ['RUNNING', 'ARRIVED'] as const;
export type ManifestKanbanStatus = (typeof MANIFEST_KANBAN_STATUSES)[number];

export class UpdateManifestKanbanDto {
  @ApiPropertyOptional({ enum: MANIFEST_KANBAN_STATUSES })
  @IsOptional()
  @IsIn(MANIFEST_KANBAN_STATUSES)
  status?: ManifestKanbanStatus;

  @ApiPropertyOptional({ example: 'SEAL002' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9._-]*$/)
  seal_code?: string;

  @ApiPropertyOptional({ example: 'Ghi chú cập nhật' })
  @IsOptional()
  @IsString()
  note?: string;
}
