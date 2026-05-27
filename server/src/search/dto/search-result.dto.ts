import { ApiProperty } from '@nestjs/swagger';
import { SearchResultEntity, SearchResultType } from '../search-result.entity';

export class PaginationMetaDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total_pages: number;
}

export class SearchResultDto implements SearchResultEntity {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: ['WAYBILL', 'TRIP'] })
  type: SearchResultType;

  @ApiProperty()
  code: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  subtitle: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  hub_summary: string;

  @ApiProperty({ required: false })
  created_at?: Date;

  @ApiProperty({ required: false })
  departure_time?: Date;

  @ApiProperty({ type: [String] })
  matched_fields: string[];
}
