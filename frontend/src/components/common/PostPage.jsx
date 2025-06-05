// components/post/PostPage.jsx
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FaArrowLeft, FaTrash } from "react-icons/fa6";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useState } from "react";
import Post from "../common/Post";
import LoadingSpinner from "../common/LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const PostPage = () => {
  const { id: postId } = useParams();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/posts/${postId}`);
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch post");
        }
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
  });

  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/comment/${postId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: commentText }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Comment added successfully!");
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: deleteComment, isPending: isDeletingComment } = useMutation({
    mutationFn: async (commentId) => {
      try {
        const res = await fetch(`/api/posts/comment/${postId}/${commentId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to delete comment");
        }
        return data;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      toast.success("Comment deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: toggleCommentLike, isPending: isLikingComment } = useMutation({
  mutationFn: async (commentId) => {
    // /comment/like/:id/:commentId
    const res = await fetch(`/api/posts/comment/like/${postId}/${commentId}`, {
      method: "POST",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to toggle like");
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["post", postId] });
  },
  onError: (error) => {
    toast.error(error.message);
  },
});


  const renderTextWithMentions = (text) => {
    if (!text) return null;
    const mentionRegex = /@([a-zA-Z0-9_]+)/g;
    const parts = text.split(mentionRegex);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <Link
            key={index}
            to={`/profile/${part}`}
            className="text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            @{part}
          </Link>
        );
      }
      return part;
    });
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (isCommenting) return;
    commentPost();
  };

  const handleDeleteComment = (commentId) => {
    deleteComment(commentId);
  };

  return (
    <div className="flex-[4_4_0] border-r border-gray-700 min-h-screen p-4">
      {/* Header */}
      <div className="flex gap-10 px-4 py-2 items-center border-b border-gray-700">
        <Link to="/">
          <FaArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="font-bold text-lg">Post</h2>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center mt-4">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error or Non-Existent Post */}
      {error && (
        <div className="flex flex-col items-center mt-4">
          <span className="text-2xl font-semibold text-white">
            Post not found
          </span>
          <Link to="/" className="text-sm text-blue-500 hover:underline mt-1">
            Go back ?
          </Link>
        </div>
      )}

      {/* Post and Comments */}
      {post && (
        <div className="flex flex-col gap-4">
          {/* Main Post */}
          <Post post={post} />

          {/* Comment Form */}
          <form
            className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-4"
            onSubmit={handlePostComment}
          >
            <textarea
              className="textarea w-full p-2 rounded text-md resize-none border focus:outline-none border-gray-800"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              className="btn btn-primary rounded-full btn-sm text-white px-4"
              disabled={isCommenting || !commentText.trim()}
            >
              {isCommenting ? <LoadingSpinner size="sm" /> : "Post"}
            </button>
          </form>

          {/* Comments Section */}
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-lg">Comments</h3>
            {post.comments.length === 0 ? (
              <p className="text-sm text-slate-500">
                No comments yet 🤔 Be the first to comment!
              </p>
            ) : (
              post.comments.map((comment) => {
  const isLiked = comment.likes.includes(authUser._id);

  return (
    <div key={comment._id} className="flex gap-2 items-start relative">
      <div className="avatar">
        <Link to={`/profile/${comment.user.username}`} className="w-8 rounded-full overflow-hidden">
          <img
            src={comment.user.profileImg || "/avatar-placeholder.png"}
            alt={`${comment.user.username}'s profile`}
          />
        </Link>
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex items-center gap-1">
          <Link
            to={`/profile/${comment.user.username}`}
            className="font-bold text-sm hover:underline"
          >
            @{comment.user.username}
          </Link>
          {comment.createdAt && (
            <span className="text-xs text-slate-500">
              · {formatPostDate(comment.createdAt)}
            </span>
          )}
        </div>
        <span className="text-sm">
          {renderTextWithMentions(comment.text)}
        </span>
        <div className="flex gap-2 mt-2 items-center">
          <div
            className="flex gap-1 items-center group cursor-pointer"
            onClick={() => toggleCommentLike(comment._id)}
          >
            {isLikingComment && <LoadingSpinner size="sm" />}
            {!isLiked && !isLikingComment && (
              <FaRegHeart className="w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500" />
            )}
            {isLiked && !isLikingComment && (
              <FaHeart className="w-4 h-4 cursor-pointer text-pink-500 group-hover:text-pink-800" />
            )}
            <span
              className={`text-sm group-hover:text-pink-500 ${isLiked ? "text-pink-500 group-hover:text-pink-800" : "text-slate-500"}`}
            >
              {comment.likes.length}
            </span>
          </div>
        </div>
      </div>
      {authUser?._id === comment.user._id && (
        <span className="absolute right-0 top-0">
          {isDeletingComment ? (
            <LoadingSpinner size="sm" />
          ) : (
            <FaTrash
              className="cursor-pointer hover:text-red-500 w-4 h-4"
              onClick={() => handleDeleteComment(comment._id)}
            />
          )}
        </span>
      )}
    </div>
  );
})

            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostPage;