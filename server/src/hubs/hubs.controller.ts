import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';
import { Roles } from '../common/roles';
import { CreateHubDto } from './dto/create-hub.dto';
import { QueryHubsDto } from './dto/query-hubs.dto';
import { UpdateHubStatusDto } from './dto/update-hub-status.dto';
import { UpdateHubDto } from './dto/update-hub.dto';
import { HubsService } from './hubs.service';

@ApiTags('Hubs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('hubs')
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Create a hub or warehouse' })
  create(@Body() dto: CreateHubDto) {
    return this.hubsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List hubs with filters and pagination' })
  findAll(@Query() query: QueryHubsDto) {
    return this.hubsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'List active hubs for dropdowns' })
  findActiveHubs() {
    return this.hubsService.findActiveHubs();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get hub details' })
  findOne(@Param('id') id: string) {
    return this.hubsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Update hub information' })
  update(@Param('id') id: string, @Body() dto: UpdateHubDto) {
    return this.hubsService.update(id, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Activate or deactivate a hub' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateHubStatusDto) {
    return this.hubsService.updateStatus(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles(Roles.DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a hub' })
  remove(@Param('id') id: string) {
    return this.hubsService.remove(id);
  }
}
