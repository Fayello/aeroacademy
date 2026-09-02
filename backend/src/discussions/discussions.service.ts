import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiscussionsService {
  constructor(private prisma: PrismaService) {}

  async getPosts(
    courseId: string | null,
    query: {
      page?: number;
      limit?: number;
      tag?: string;
      sort?: string;
      search?: string;
      labId?: string;
    },
  ) {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 50);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.labId) where.labId = query.labId;
    else if (courseId) where.courseId = courseId;

    if (query.tag) where.tags = { has: query.tag };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { body: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any =
      query.sort === 'recent'
        ? [{ isPinned: 'desc' }, { createdAt: 'desc' }]
        : query.sort === 'popular'
          ? [
              { isPinned: 'desc' },
              { upvotes: 'desc' },
              { commentCount: 'desc' },
            ]
          : [{ isPinned: 'desc' }, { createdAt: 'desc' }];

    const [posts, total] = await Promise.all([
      this.prisma.discussionPost.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, xp: true, division: true } },
          _count: { select: { comments: true, votes: true } },
        },
      }),
      this.prisma.discussionPost.count({ where }),
    ]);

    return { posts, total, page, pages: Math.ceil(total / limit) };
  }

  async getPost(postId: string, userId?: string) {
    const post = await this.prisma.discussionPost.findUnique({
      where: { id: postId },
      include: {
        user: { select: { id: true, name: true, xp: true, division: true } },
        lab: { select: { id: true, title: true } },
        course: { select: { id: true, title: true } },
        comments: {
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, xp: true } },
            replies: {
              orderBy: { createdAt: 'asc' },
              include: {
                user: { select: { id: true, name: true, xp: true } },
              },
            },
            votes: true,
          },
        },
        votes: true,
        _count: { select: { comments: true, votes: true } },
      },
    });

    if (!post) throw new NotFoundException('Post not found');

    let myVote = 0;
    if (userId) {
      const v = await this.prisma.discussionVote.findUnique({
        where: { userId_postId: { userId, postId } },
      });
      myVote = v?.value || 0;
    }

    return { ...post, myVote };
  }

  async getPostComments(postId: string) {
    const comments = await this.prisma.discussionComment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        user: { select: { id: true, name: true, xp: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, name: true, xp: true } },
          },
        },
        votes: true,
      },
    });
    return comments;
  }

  async createPost(
    userId: string,
    data: {
      title: string;
      body: string;
      tags?: string[];
      courseId?: string;
      labId?: string;
    },
  ) {
    if (data.labId) {
      return this.prisma.discussionPost.create({
        data: {
          labId: data.labId,
          userId,
          title: data.title,
          body: data.body,
          tags: data.tags || [],
        },
        include: { user: { select: { id: true, name: true } } },
      });
    }

    const courseId = data.courseId!;
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });
    if (!enrollment) throw new ForbiddenException('Must be enrolled to post');

    return this.prisma.discussionPost.create({
      data: {
        courseId,
        userId,
        title: data.title,
        body: data.body,
        tags: data.tags || [],
      },
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async updatePost(
    userId: string,
    postId: string,
    data: {
      title?: string;
      body?: string;
      tags?: string[];
      isResolved?: boolean;
    },
  ) {
    const post = await this.prisma.discussionPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Not your post');

    return this.prisma.discussionPost.update({
      where: { id: postId },
      data,
      include: { user: { select: { id: true, name: true } } },
    });
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.discussionPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new ForbiddenException('Not your post');

    await this.prisma.discussionPost.delete({ where: { id: postId } });
    return { success: true };
  }

  async createComment(
    userId: string,
    postId: string,
    data: { body: string; parentId?: string; parentCommentId?: string },
  ) {
    const post = await this.prisma.discussionPost.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.discussionComment.create({
      data: {
        postId,
        userId,
        body: data.body,
        parentId: data.parentId || data.parentCommentId || null,
      },
      include: { user: { select: { id: true, name: true } } },
    });

    await this.prisma.discussionPost.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    return comment;
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.discussionComment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId)
      throw new ForbiddenException('Not your comment');

    await this.prisma.discussionComment.delete({ where: { id: commentId } });
    await this.prisma.discussionPost.update({
      where: { id: comment.postId },
      data: { commentCount: { decrement: 1 } },
    });
    return { success: true };
  }

  async vote(
    userId: string,
    data: { postId?: string; commentId?: string; value: 1 | -1 },
  ) {
    if (data.postId) {
      const existing = await this.prisma.discussionVote.findUnique({
        where: { userId_postId: { userId, postId: data.postId } },
      });

      if (existing) {
        if (existing.value === data.value) {
          await this.prisma.discussionVote.delete({
            where: { id: existing.id },
          });
          await this.prisma.discussionPost.update({
            where: { id: data.postId },
            data: { upvotes: { decrement: data.value } },
          });
          return { voted: false };
        }
        await this.prisma.discussionVote.update({
          where: { id: existing.id },
          data: { value: data.value },
        });
        await this.prisma.discussionPost.update({
          where: { id: data.postId },
          data: { upvotes: { increment: data.value * 2 } },
        });
        return { voted: true };
      }

      await this.prisma.discussionVote.create({
        data: { userId, postId: data.postId, value: data.value },
      });
      await this.prisma.discussionPost.update({
        where: { id: data.postId },
        data: { upvotes: { increment: data.value } },
      });
      return { voted: true };
    }

    if (data.commentId) {
      const existing = await this.prisma.discussionVote.findUnique({
        where: { userId_commentId: { userId, commentId: data.commentId } },
      });

      if (existing) {
        if (existing.value === data.value) {
          await this.prisma.discussionVote.delete({
            where: { id: existing.id },
          });
          await this.prisma.discussionComment.update({
            where: { id: data.commentId },
            data: { upvotes: { decrement: data.value } },
          });
          return { voted: false };
        }
        await this.prisma.discussionVote.update({
          where: { id: existing.id },
          data: { value: data.value },
        });
        await this.prisma.discussionComment.update({
          where: { id: data.commentId },
          data: { upvotes: { increment: data.value * 2 } },
        });
        return { voted: true };
      }

      await this.prisma.discussionVote.create({
        data: { userId, commentId: data.commentId, value: data.value },
      });
      await this.prisma.discussionComment.update({
        where: { id: data.commentId },
        data: { upvotes: { increment: data.value } },
      });
      return { voted: true };
    }

    throw new ForbiddenException('Provide postId or commentId');
  }

  async getStats(courseId: string | null, labId?: string) {
    const where: any = labId ? { labId } : { courseId };
    const postWhere: any = labId ? { labId } : { courseId };
    const [totalPosts, totalComments, resolvedCount] = await Promise.all([
      this.prisma.discussionPost.count({ where: postWhere }),
      this.prisma.discussionComment.count({ where: { post: postWhere } }),
      this.prisma.discussionPost.count({
        where: { ...postWhere, isResolved: true },
      }),
    ]);
    return { totalPosts, totalComments, resolvedCount };
  }

  async getTags(courseId: string | null, labId?: string) {
    const where: any = labId ? { labId } : { courseId };
    const posts = await this.prisma.discussionPost.findMany({
      where,
      select: { tags: true },
    });
    const tagMap = new Map<string, number>();
    posts.forEach((p) =>
      p.tags.forEach((t) => tagMap.set(t, (tagMap.get(t) || 0) + 1)),
    );
    return Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }
}
