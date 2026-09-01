"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchApi } from "@/lib/api";
import { useParams } from "next/navigation";
import toast from "@/lib/toast";
import Link from "next/link";
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  CheckCircle,
  Loader2,
  X,
} from "lucide-react";

interface DiscussionAuthor {
  id: string;
  name: string | null;
  email: string;
  division: string;
}

interface DiscussionComment {
  id: string;
  postId: string;
  userId: string;
  body: string;
  parentCommentId: string | null;
  upvotes: number;
  createdAt: string;
  updatedAt: string;
  author: DiscussionAuthor;
  userVote?: number;
  replies?: DiscussionComment[];
}

interface DiscussionPost {
  id: string;
  labId: string;
  userId: string;
  title: string;
  body: string;
  tags: string[];
  pinned: boolean;
  resolved: boolean;
  upvotes: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  author: DiscussionAuthor;
  userVote?: number;
}

export default function LabDiscussionPostClient() {
  const { id: labId, postId } = useParams();
  const [post, setPost] = useState<DiscussionPost | null>(null);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [commentBody, setCommentBody] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [postData, commentsData] = await Promise.all([
        fetchApi<Record<string, unknown>>(`/discussions/${postId}`),
        fetchApi<Record<string, unknown>[]>(`/discussions/${postId}/comments`),
      ]);

      const mappedPost: DiscussionPost = {
        id: postData.id as string,
        labId: postData.labId as string,
        userId: postData.userId as string,
        title: postData.title as string,
        body: postData.body as string,
        tags: (postData.tags as string[]) || [],
        pinned: (postData.isPinned as boolean) ?? (postData.pinned as boolean) ?? false,
        resolved: (postData.isResolved as boolean) ?? (postData.resolved as boolean) ?? false,
        upvotes: (postData.upvotes as number) ?? 0,
        commentCount: (postData.commentCount as number) ?? ((postData._count as Record<string, number> | undefined)?.comments ?? 0),
        createdAt: postData.createdAt as string,
        updatedAt: postData.updatedAt as string,
        author: (postData.author as DiscussionAuthor) ?? { id: ((postData.user as Record<string, unknown>)?.id as string) || (postData.userId as string), name: ((postData.user as Record<string, unknown>)?.name as string) || null, email: "", division: "" },
        userVote: (postData.userVote as number) ?? (postData.myVote as number) ?? 0,
      };
      setPost(mappedPost);

      const mappedComments: DiscussionComment[] = (commentsData || []).map((c) => ({
        id: c.id as string,
        postId: c.postId as string,
        userId: c.userId as string,
        body: c.body as string,
        parentCommentId: (c.parentCommentId as string) ?? (c.parentId as string) ?? null,
        upvotes: (c.upvotes as number) ?? 0,
        createdAt: c.createdAt as string,
        updatedAt: c.updatedAt as string,
        author: (c.author as DiscussionAuthor) ?? { id: ((c.user as Record<string, unknown>)?.id as string) || (c.userId as string), name: ((c.user as Record<string, unknown>)?.name as string) || null, email: "", division: "" },
        userVote: (c.userVote as number) ?? 0,
        replies: ((c.replies as Record<string, unknown>[] | undefined) || []).map((r) => ({
          id: r.id as string,
          postId: r.postId as string,
          userId: r.userId as string,
          body: r.body as string,
          parentCommentId: (r.parentCommentId as string) ?? (r.parentId as string) ?? null,
          upvotes: (r.upvotes as number) ?? 0,
          createdAt: r.createdAt as string,
          updatedAt: r.updatedAt as string,
          author: (r.author as DiscussionAuthor) ?? { id: ((r.user as Record<string, unknown>)?.id as string) || (r.userId as string), name: ((r.user as Record<string, unknown>)?.name as string) || null, email: "", division: "" },
          userVote: (r.userVote as number) ?? 0,
          replies: [],
        })),
      }));
      setComments(mappedComments);

      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        setCurrentUserId(user.id || null);
      } catch {
        setCurrentUserId(null);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load discussion"
      );
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleVotePost = async () => {
    if (!post) return;
    const prevVote = post.userVote;
    const prevUpvotes = post.upvotes;
    const newVote = prevVote === 1 ? 0 : 1;

    setPost({
      ...post,
      userVote: newVote,
      upvotes: prevUpvotes + (newVote === 1 ? 1 : -1),
    });

    try {
      await fetchApi(`/discussions/${postId}/vote`, {
        method: "POST",
        body: JSON.stringify({ value: newVote }),
      });
    } catch {
      setPost({ ...post, userVote: prevVote, upvotes: prevUpvotes });
      toast.error("Failed to vote");
    }
  };

  const handleVoteComment = async (commentId: string, currentVote: number) => {
    const newVote = currentVote === 1 ? 0 : 1;

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            userVote: newVote,
            upvotes: c.upvotes + (newVote === 1 ? 1 : -1),
          };
        }
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === commentId
                ? {
                    ...r,
                    userVote: newVote,
                    upvotes: r.upvotes + (newVote === 1 ? 1 : -1),
                  }
                : r
            ),
          };
        }
        return c;
      })
    );

    try {
      await fetchApi(`/discussions/comments/${commentId}/vote`, {
        method: "POST",
        body: JSON.stringify({ value: newVote }),
      });
    } catch {
      fetchData();
      toast.error("Failed to vote");
    }
  };

  const handleCreateComment = async () => {
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      await fetchApi(`/discussions/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: commentBody.trim() }),
      });
      toast.success("Comment posted");
      setCommentBody("");
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to post comment"
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCreateReply = async (parentCommentId: string) => {
    if (!replyBody.trim()) return;
    setSubmittingReply(true);
    try {
      await fetchApi(`/discussions/${postId}/comments`, {
        method: "POST",
        body: JSON.stringify({
          body: replyBody.trim(),
          parentCommentId,
        }),
      });
      toast.success("Reply posted");
      setReplyBody("");
      setReplyingTo(null);
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to post reply"
      );
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    setDeleting("post");
    try {
      await fetchApi(`/discussions/${postId}`, { method: "DELETE" });
      toast.success("Post deleted");
      window.location.href = `/dashboard/labs/${labId}/discussions`;
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete post"
      );
      setDeleting(null);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    setDeleting(commentId);
    try {
      await fetchApi(`/discussions/comments/${commentId}`, {
        method: "DELETE",
      });
      toast.success("Comment deleted");
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete comment"
      );
      setDeleting(null);
    }
  };

  const handleToggleResolved = async () => {
    if (!post) return;
    const prev = post.resolved;
    setPost({ ...post, resolved: !prev });
    try {
      await fetchApi(`/discussions/${postId}`, {
        method: "PATCH",
        body: JSON.stringify({ isResolved: !prev }),
      });
      toast.success(prev ? "Marked as unresolved" : "Marked as resolved");
    } catch {
      setPost({ ...post, resolved: prev });
      toast.error("Failed to update status");
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editBody.trim()) return;
    setSavingEdit(true);
    try {
      await fetchApi(`/discussions/comments/${commentId}`, {
        method: "PATCH",
        body: JSON.stringify({ body: editBody.trim() }),
      });
      toast.success("Comment updated");
      setEditingComment(null);
      setEditBody("");
      await fetchData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update comment"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  const buildCommentTree = (flat: DiscussionComment[]): DiscussionComment[] => {
    const map = new Map<string, DiscussionComment>();
    const roots: DiscussionComment[] = [];

    flat.forEach((c) => map.set(c.id, { ...c, replies: [] }));

    flat.forEach((c) => {
      const node = map.get(c.id)!;
      if (c.parentCommentId && map.has(c.parentCommentId)) {
        map.get(c.parentCommentId)!.replies!.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const renderComment = (comment: DiscussionComment, depth = 0) => {
    const isOwn = currentUserId === comment.userId;
    const isEditing = editingComment === comment.id;
    const maxDepth = 3;

    return (
      <div
        key={comment.id}
        className={`${depth > 0 ? "ml-6 sm:ml-10 pl-4 border-l-2 border-white/10" : ""}`}
      >
        <div className="py-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-xs font-semibold text-[#0F203A]">
                {(comment.author.name || comment.author.email)[0].toUpperCase()}
              </div>
              <div>
                <span className="text-sm font-medium text-slate-200">
                  {comment.author.name || comment.author.email.split("@")[0]}
                </span>
                <span className="text-xs text-slate-400 ml-2">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwn && !isEditing && (
                <>
                  <button
                    onClick={() => {
                      setEditingComment(comment.id);
                      setEditBody(comment.body);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deleting === comment.id}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting === comment.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      "Delete"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditComment(comment.id)}
                  disabled={savingEdit || !editBody.trim()}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#7AD62A] hover:bg-[#0F203A] disabled:opacity-50 rounded-lg transition-colors"
                >
                  {savingEdit ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingComment(null);
                    setEditBody("");
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {comment.body}
            </p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => handleVoteComment(comment.id, comment.userVote || 0)}
                className={`inline-flex items-center gap-1 text-xs transition-colors ${
                  comment.userVote === 1
                    ? "text-[#7AD62A] font-medium"
                    : "text-slate-400 hover:text-slate-300"
                }`}
              >
                <ThumbsUp
                  size={12}
                  className={comment.userVote === 1 ? "fill-[#7AD62A]" : ""}
                />
                {comment.upvotes}
              </button>
              {depth < maxDepth && (
                <button
                  onClick={() =>
                    setReplyingTo(replyingTo === comment.id ? null : comment.id)
                  }
                  className="text-xs text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Reply
                </button>
              )}
            </div>
          )}

          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="flex-1 px-3 py-2 text-sm border border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => handleCreateReply(comment.id)}
                  disabled={submittingReply || !replyBody.trim()}
                  className="px-3 py-2 bg-[#7AD62A] hover:bg-[#0F203A] disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  {submittingReply ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    "Reply"
                  )}
                </button>
                <button
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyBody("");
                  }}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div>
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#7AD62A]" size={32} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">Discussion not found.</p>
        <Link
          href={`/dashboard/labs/${labId}/discussions`}
          className="mt-4 inline-block text-sm text-[#7AD62A] hover:text-[#0F203A]"
        >
          ← Back to discussions
        </Link>
      </div>
    );
  }

  const isOwnPost = currentUserId === post.userId;
  const commentTree = buildCommentTree(comments);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <Link
        href={`/dashboard/labs/${labId}/discussions`}
        className="inline-flex items-center gap-1 text-sm text-[#7AD62A] hover:text-[#0F203A] transition-colors"
      >
        ← Back to discussions
      </Link>

      <div className="bg-[#0f172a] rounded-xl border border-white/10 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {post.pinned && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
                <Pin size={10} />
                Pinned
              </span>
            )}
            {post.resolved && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0F203A] bg-[#7AD62A]/10 px-2.5 py-1 rounded-full">
                <CheckCircle size={10} />
                Resolved
              </span>
            )}
          </div>

          <h1 className="text-xl font-bold text-white mb-3">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-sm font-semibold text-[#0F203A]">
              {(post.author.name || post.author.email)[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">
                {post.author.name || post.author.email.split("@")[0]}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(post.createdAt).toLocaleDateString()} at{" "}
                {new Date(post.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {post.body}
          </div>

          {post.tags.length > 0 && (
            <div className="flex items-center gap-1.5 mt-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium text-slate-500 bg-white/5 px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center gap-4">
              <button
                onClick={handleVotePost}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  post.userVote === 1
                    ? "bg-[#7AD62A]/10 text-[#0F203A] border border-[#7AD62A]/20"
                    : "text-slate-500 hover:bg-white/5 border border-white/10"
                }`}
              >
                <ThumbsUp
                  size={16}
                  className={post.userVote === 1 ? "fill-[#7AD62A]" : ""}
                />
                {post.upvotes}
              </button>

              <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                <MessageSquare size={16} />
                {post.commentCount} comment{post.commentCount !== 1 ? "s" : ""}
              </span>
            </div>

            {isOwnPost && (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleResolved}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                    post.resolved
                      ? "bg-[#7AD62A]/10 text-[#0F203A] border-[#7AD62A]/20"
                      : "text-slate-500 border-white/10 hover:bg-white/5"
                  }`}
                >
                  <CheckCircle size={14} />
                  {post.resolved ? "Resolved" : "Mark Resolved"}
                </button>
                <button
                  onClick={handleDeletePost}
                  disabled={deleting === "post"}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-500 border border-red-200 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                >
                  {deleting === "post" ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <X size={14} />
                  )}
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          Comments ({comments.length})
        </h2>

        <div className="mb-6 pb-6 border-b border-white/10">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-sm font-semibold text-[#0F203A] shrink-0">
              {currentUserId
                ? JSON.parse(localStorage.getItem("user") || "{}")
                    .name?.[0]?.toUpperCase() || "?"
                : "?"}
            </div>
            <div className="flex-1">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Write a comment..."
                rows={3}
                className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={handleCreateComment}
                  disabled={submittingComment || !commentBody.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#7AD62A] hover:bg-[#0F203A] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {submittingComment && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {submittingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare
              size={32}
              className="mx-auto text-slate-300 mb-2"
            />
            <p className="text-sm text-slate-400">
              No comments yet. Be the first to respond.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {commentTree.map((comment) => renderComment(comment, 0))}
          </div>
        )}
      </div>
    </div>
  );
}
