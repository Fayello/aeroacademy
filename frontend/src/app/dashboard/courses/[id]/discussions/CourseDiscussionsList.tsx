"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { fetchApi } from "@/lib/api";
import { useParams } from "next/navigation";
import toast from "@/lib/toast";
import Link from "next/link";
import {
  MessageSquare,
  ThumbsUp,
  Pin,
  CheckCircle,
  Plus,
  Search,
  Filter,
  ChevronDown,
  Loader2,
  X,
} from "lucide-react";

interface DiscussionAuthor {
  id: string;
  name: string | null;
  email: string;
  division: string;
}

interface DiscussionPost {
  id: string;
  courseId: string;
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

const ALL_TAGS = [
  "General",
  "Question",
  "Bug",
  "Tutorial",
  "Discussion",
  "Resource",
  "Help",
  "Feature Request",
];

export default function CourseDiscussionsList() {
  const { id: courseId } = useParams();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  const limit = 15;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(e.target as Node)
      ) {
        setShowTagDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchPosts = useCallback(
    async (pageNum: number, append = false) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams({
          page: String(pageNum),
          limit: String(limit),
          sort: sortBy,
        });
        if (debouncedSearch) params.set("search", debouncedSearch);
        if (selectedTag) params.set("tag", selectedTag);

        const raw = (await fetchApi<Record<string, unknown>>(
          `/discussions/course/${courseId}?${params.toString()}`
        ));

        const mapped: DiscussionPost[] = ((raw.posts as Record<string, unknown>[] | undefined) || []).map((p) => ({
          id: p.id as string,
          courseId: p.courseId as string,
          userId: p.userId as string,
          title: p.title as string,
          body: p.body as string,
          tags: (p.tags as string[]) || [],
          pinned: (p.isPinned as boolean) ?? (p.pinned as boolean) ?? false,
          resolved: (p.isResolved as boolean) ?? (p.resolved as boolean) ?? false,
          upvotes: (p.upvotes as number) ?? 0,
          commentCount: (p.commentCount as number) ?? ((p._count as Record<string, number> | undefined)?.comments ?? 0),
          createdAt: p.createdAt as string,
          updatedAt: p.updatedAt as string,
          author: (p.author as DiscussionAuthor) ?? { id: ((p.user as Record<string, unknown>)?.id as string) || (p.userId as string), name: ((p.user as Record<string, unknown>)?.name as string) || null, email: "", division: "" },
          userVote: (p.userVote as number) ?? (p.myVote as number) ?? 0,
        }));

        setPosts((prev) => (append ? [...prev, ...mapped] : mapped));
        setTotalPages((raw.totalPages as number) ?? (raw.pages as number) ?? 1);
        setTotal((raw.total as number) ?? 0);
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Failed to load discussions"
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [courseId, sortBy, debouncedSearch, selectedTag]
  );

  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [fetchPosts]);

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      const next = page + 1;
      setPage(next);
      fetchPosts(next, true);
    }
  };

  const handleCreatePost = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast.error("Title and body are required");
      return;
    }
    setCreating(true);
    try {
      await fetchApi(`/discussions/course/${courseId}`, {
        method: "POST",
        body: JSON.stringify({
          title: newTitle.trim(),
          body: newBody.trim(),
          tags: newTags,
        }),
      });
      toast.success("Post created");
      setShowCreateModal(false);
      setNewTitle("");
      setNewBody("");
      setNewTags([]);
      setPage(1);
      fetchPosts(1, false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create post"
      );
    } finally {
      setCreating(false);
    }
  };

  const addTag = (tag: string) => {
    const t = tag.trim();
    if (t && !newTags.includes(t) && newTags.length < 5) {
      setNewTags([...newTags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setNewTags(newTags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const filteredAvailableTags = ALL_TAGS.filter(
    (t) => !newTags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/dashboard/courses/${courseId}`}
            className="text-sm text-[#7AD62A] hover:text-[#0F203A] transition-colors"
          >
            ← Back to course
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">
            Course Discussions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {total} discussion{total !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#7AD62A] hover:bg-[#0F203A] text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          New Post
        </button>
      </div>

      {/* Filters */}
      <div className="bg-[#0f172a] rounded-xl border border-white/10 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
            />
          </div>

          {/* Tag Filter */}
          <div className="relative" ref={tagDropdownRef}>
            <button
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm border rounded-lg transition-colors ${
                selectedTag
                  ? "border-[#7AD62A]/30 bg-[#7AD62A]/10 text-[#0F203A]"
                  : "border-white/10 text-slate-400 hover:border-white/10"
              }`}
            >
              <Filter size={14} />
              {selectedTag || "All Tags"}
              <ChevronDown size={14} />
            </button>
            {showTagDropdown && (
              <div className="absolute z-20 mt-1 w-48 bg-[#0f172a] border border-white/10 rounded-lg shadow-lg py-1">
                <button
                  onClick={() => {
                    setSelectedTag("");
                    setShowTagDropdown(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${
                    !selectedTag ? "text-[#7AD62A] font-medium" : "text-slate-400"
                  }`}
                >
                  All Tags
                </button>
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => {
                      setSelectedTag(tag);
                      setShowTagDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-white/5 ${
                      selectedTag === tag
                        ? "text-[#7AD62A] font-medium"
                        : "text-slate-400"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Toggle */}
          <div className="inline-flex border border-white/10 rounded-lg overflow-hidden">
            <button
              onClick={() => setSortBy("recent")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                sortBy === "recent"
                  ? "bg-[#7AD62A] text-white"
                  : "bg-[#0f172a] text-slate-400 hover:bg-white/5"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy("popular")}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                sortBy === "popular"
                  ? "bg-[#7AD62A] text-white"
                  : "bg-[#0f172a] text-slate-400 hover:bg-white/5"
              }`}
            >
              Popular
            </button>
          </div>
        </div>
      </div>

      {/* Posts List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-[#7AD62A]" size={28} />
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-[#0f172a] rounded-xl border border-white/10 p-12 text-center">
          <MessageSquare size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">No discussions yet</p>
          <p className="text-sm text-slate-400 mt-1">
            Be the first to start a conversation about this course.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#7AD62A] hover:bg-[#0F203A] text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={14} />
            New Post
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/dashboard/courses/${courseId}/discussions/${post.id}`}
                className="block bg-[#0f172a] rounded-xl border border-white/10 p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  {/* Upvote Column */}
                  <div className="flex flex-col items-center gap-1 pt-0.5 min-w-[48px]">
                    <ThumbsUp
                      size={16}
                      className={
                        post.userVote === 1
                          ? "text-[#7AD62A] fill-[#7AD62A]"
                          : "text-slate-300"
                      }
                    />
                    <span
                      className={`text-sm font-semibold ${
                        post.userVote === 1 ? "text-[#7AD62A]" : "text-slate-500"
                      }`}
                    >
                      {post.upvotes}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {post.pinned && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Pin size={10} />
                          Pinned
                        </span>
                      )}
                      {post.resolved && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#0F203A] bg-[#7AD62A]/10 px-2 py-0.5 rounded-full">
                          <CheckCircle size={10} />
                          Resolved
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-white mb-1 line-clamp-1">
                      {post.title}
                    </h3>
                    <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                      {post.body}
                    </p>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Author */}
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#7AD62A]/10 flex items-center justify-center text-xs font-semibold text-[#0F203A] shrink-0">
                            {(post.author.name || post.author.email)[0].toUpperCase()}
                          </div>
                          <span className="text-xs text-slate-500 truncate">
                            {post.author.name || post.author.email.split("@")[0]}
                          </span>
                        </div>
                        <span className="text-xs text-slate-300">·</span>
                        <span className="text-xs text-slate-400">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Tags */}
                        {post.tags.length > 0 && (
                          <div className="hidden sm:flex items-center gap-1">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-medium text-slate-500 bg-white/5 px-2 py-0.5 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {post.tags.length > 3 && (
                              <span className="text-[10px] text-slate-400">
                                +{post.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Comment Count */}
                        <div className="flex items-center gap-1 text-slate-400">
                          <MessageSquare size={14} />
                          <span className="text-xs font-medium">
                            {post.commentCount}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load More */}
          {page < totalPages && (
            <div className="flex justify-center pt-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-[#7AD62A] border border-[#7AD62A]/20 hover:bg-[#7AD62A]/10 rounded-lg transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <ChevronDown size={14} />
                )}
                {loadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Post Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative bg-[#0f172a] rounded-2xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">
                New Discussion
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-white/5 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What's your question or topic?"
                  className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
                  maxLength={200}
                />
                <p className="text-xs text-slate-400 mt-1">
                  {newTitle.length}/200
                </p>
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Body
                </label>
                <textarea
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Describe your question or share your thoughts..."
                  rows={6}
                  className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Tags
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {newTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#0F203A] bg-[#7AD62A]/10 px-2.5 py-1 rounded-full"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-[#0F203A]"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    onFocus={() => setShowTagDropdown(true)}
                    placeholder="Type a tag and press Enter..."
                    className="w-full px-3 py-2.5 text-sm border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7AD62A]/20 focus:border-[#7AD62A]"
                    disabled={newTags.length >= 5}
                  />
                  {showTagDropdown && tagInput && filteredAvailableTags.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-[#0f172a] border border-white/10 rounded-lg shadow-lg py-1 max-h-40 overflow-auto">
                      {filteredAvailableTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => {
                            addTag(tag);
                            setShowTagDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm text-slate-400 hover:bg-white/5"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {newTags.length}/5 tags
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-white/10">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePost}
                disabled={creating || !newTitle.trim() || !newBody.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7AD62A] hover:bg-[#0F203A] disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {creating && <Loader2 size={14} className="animate-spin" />}
                {creating ? "Posting..." : "Post Discussion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
