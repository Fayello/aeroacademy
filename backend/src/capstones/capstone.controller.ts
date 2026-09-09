import { Controller, Get, Param, Request, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CapstoneService } from './capstone.service';
import type { RequestWithUser } from '../common/request-with-user';

@Controller('api/v1/capstones')
@UseGuards(AuthGuard('jwt'))
export class CapstoneController {
  constructor(private readonly capstoneService: CapstoneService) {}

  @Get('detail/:id')
  async getDetail(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.capstoneService.getCapstoneDetail(id, req.user.id);
  }

  @Get('my-progress')
  async getMyProgress(@Request() req: RequestWithUser) {
    return this.capstoneService.getUserCapstoneProgress(req.user.id);
  }
}
