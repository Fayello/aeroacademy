import { Controller, Get, Post, Delete, Patch, Param, Body, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DiscussionsService } from './discussions.service';

@Controller('discussions')
@UseGuards(AuthGuard('jwt'))
export class DiscussionsController {
  constructor(private discussionsService: DiscussionsService) {}

  @Get('course/:courseId')
  getPosts(
    @Param('courseId') courseId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
  ) {
    return this.discussionsService.getPosts(courseId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      tag,
      sort,
      search,
    });
  }

  @Get('course/:courseId/stats')
  getStats(@Param('courseId') courseId: string) {
    return this.discussionsService.getStats(courseId);
  }

  @Get('course/:courseId/tags')
  getTags(@Param('courseId') courseId: string) {
    return this.discussionsService.getTags(courseId);
  }

  @Get(':postId')
  getPost(@Param('postId') postId: string, @Req() req: any) {
    return this.discussionsService.getPost(postId, req.user.id);
  }

  @Post('course/:courseId')
  createPost(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() body: { title: string; body: string; tags?: string[] },
  ) {
    return this.discussionsService.createPost(req.user.id, courseId, body);
  }

  @Patch(':postId')
  updatePost(
    @Req() req: any,
    @Param('postId') postId: string,
    @Body() body: { title?: string; body?: string; tags?: string[]; isResolved?: boolean },
  ) {
    return this.discussionsService.updatePost(req.user.id, postId, body);
  }

  @Delete(':postId')
  deletePost(@Req() req: any, @Param('postId') postId: string) {
    return this.discussionsService.deletePost(req.user.id, postId);
  }

  @Post(':postId/comments')
  createComment(
    @Req() req: any,
    @Param('postId') postId: string,
    @Body() body: { body: string; parentId?: string },
  ) {
    return this.discussionsService.createComment(req.user.id, postId, body);
  }

  @Delete('comments/:commentId')
  deleteComment(@Req() req: any, @Param('commentId') commentId: string) {
    return this.discussionsService.deleteComment(req.user.id, commentId);
  }

  @Post('vote')
  vote(@Req() req: any, @Body() body: { postId?: string; commentId?: string; value: 1 | -1 }) {
    return this.discussionsService.vote(req.user.id, body);
  }
}
