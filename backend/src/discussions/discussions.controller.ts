import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DiscussionsService } from './discussions.service';

@Controller('v1/discussions')
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

  @Get('lab/:labId')
  getLabPosts(
    @Param('labId') labId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tag') tag?: string,
    @Query('sort') sort?: string,
    @Query('search') search?: string,
  ) {
    return this.discussionsService.getPosts(null, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      tag,
      sort,
      search,
      labId,
    });
  }

  @Get('course/:courseId/stats')
  getStats(@Param('courseId') courseId: string) {
    return this.discussionsService.getStats(courseId);
  }

  @Get('lab/:labId/stats')
  getLabStats(@Param('labId') labId: string) {
    return this.discussionsService.getStats(null, labId);
  }

  @Get('course/:courseId/tags')
  getTags(@Param('courseId') courseId: string) {
    return this.discussionsService.getTags(courseId);
  }

  @Get('lab/:labId/tags')
  getLabTags(@Param('labId') labId: string) {
    return this.discussionsService.getTags(null, labId);
  }

  @Get(':postId')
  getPost(@Param('postId') postId: string, @Req() req: any) {
    return this.discussionsService.getPost(postId, req.user.id);
  }

  @Get(':postId/comments')
  getPostComments(@Param('postId') postId: string) {
    return this.discussionsService.getPostComments(postId);
  }

  @Post('course/:courseId')
  createCoursePost(
    @Req() req: any,
    @Param('courseId') courseId: string,
    @Body() body: { title: string; body: string; tags?: string[] },
  ) {
    return this.discussionsService.createPost(req.user.id, {
      ...body,
      courseId,
    });
  }

  @Post('lab/:labId')
  createLabPost(
    @Req() req: any,
    @Param('labId') labId: string,
    @Body() body: { title: string; body: string; tags?: string[] },
  ) {
    return this.discussionsService.createPost(req.user.id, { ...body, labId });
  }

  @Patch(':postId')
  updatePost(
    @Req() req: any,
    @Param('postId') postId: string,
    @Body()
    body: {
      title?: string;
      body?: string;
      tags?: string[];
      isResolved?: boolean;
    },
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
    @Body() body: { body: string; parentCommentId?: string },
  ) {
    return this.discussionsService.createComment(req.user.id, postId, body);
  }

  @Delete('comments/:commentId')
  deleteComment(@Req() req: any, @Param('commentId') commentId: string) {
    return this.discussionsService.deleteComment(req.user.id, commentId);
  }

  @Post(':postId/vote')
  votePost(
    @Req() req: any,
    @Param('postId') postId: string,
    @Body() body: { value: 1 | -1 },
  ) {
    return this.discussionsService.vote(req.user.id, {
      postId,
      value: body.value,
    });
  }

  @Post('comments/:commentId/vote')
  voteComment(
    @Req() req: any,
    @Param('commentId') commentId: string,
    @Body() body: { value: 1 | -1 },
  ) {
    return this.discussionsService.vote(req.user.id, {
      commentId,
      value: body.value,
    });
  }
}
