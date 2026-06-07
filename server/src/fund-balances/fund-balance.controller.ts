import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles';
import { CreateFundBalanceDto } from './dto/create-fund-balance.dto';
import { QueryFundBalanceDto } from './dto/query-fund-balance.dto';
import { UpdateFundBalanceDto } from './dto/update-fund-balance.dto';
import { FundBalanceService } from './fund-balance.service';

@ApiTags('Fund Balances')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fund-balances')
export class FundBalanceController {
  constructor(private readonly fundBalanceService: FundBalanceService) {}

  @Get()
  @ApiOperation({ summary: 'List fund balances (Số quỹ)' })
  list(@Query() query: QueryFundBalanceDto) {
    return this.fundBalanceService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get fund balance record' })
  findOne(@Param('id') id: string) {
    return this.fundBalanceService.findOne(id);
  }

  @Post()
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Create fund balance record' })
  create(@Body() dto: CreateFundBalanceDto) {
    return this.fundBalanceService.create(dto);
  }

  @Patch(':id')
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Update fund balance record' })
  update(@Param('id') id: string, @Body() dto: UpdateFundBalanceDto) {
    return this.fundBalanceService.update(id, dto);
  }

  @Delete(':id')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Delete fund balance record' })
  async remove(@Param('id') id: string) {
    await this.fundBalanceService.remove(id);
    return { success: true };
  }
}
