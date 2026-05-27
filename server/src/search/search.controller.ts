import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserEntity } from '../users/user.entity';
import { GlobalSearchDto } from './dto/global-search.dto';
import { SearchTripsDto } from './dto/search-trips.dto';
import { SearchWaybillsDto } from './dto/search-waybills.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Search waybills and trips globally' })
  globalSearch(@Query() query: GlobalSearchDto, @CurrentUser() currentUser: UserEntity) {
    return this.searchService.globalSearch(query, currentUser);
  }

  @Get('waybills')
  @ApiOperation({ summary: 'Search waybills with filters and pagination' })
  searchWaybills(@Query() query: SearchWaybillsDto, @CurrentUser() currentUser: UserEntity) {
    return this.searchService.searchWaybills(query, currentUser);
  }

  @Get('trips')
  @ApiOperation({ summary: 'Search trips with filters and pagination' })
  searchTrips(@Query() query: SearchTripsDto, @CurrentUser() currentUser: UserEntity) {
    return this.searchService.searchTrips(query, currentUser);
  }
}
