// components/common/Post.jsx
import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaShare } from "react-icons/fa6";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
  const [comment, setComment] = useState("");
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();
  const postOwner = post.user;
  const isLiked = post.likes.includes(authUser._id);
  const isSaved = authUser?.savedPosts?.includes(post._id);
  const isMyPost = authUser._id === post.user._id;
  const formattedDate = formatPostDate(post.createdAt);

  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/${post._id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/like/${post._id}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: (updatedLikes) => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.setQueryData(["post", post._id], (oldPost) => {
        if (!oldPost) return oldPost;
        return { ...oldPost, likes: updatedLikes };
      });
      queryClient.setQueryData(["saved-posts"], (oldData) => {
        if (!oldData) return oldData;
        return oldData.map((p) =>
          p._id === post._id ? { ...p, likes: updatedLikes } : p
        );
      });
       queryClient.invalidateQueries({ queryKey: ['search'], predicate: (query) => query.queryKey[0] === 'search' });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: commentPost, isPending: isCommenting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`/api/posts/comment/${post._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: comment }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("Comment added successfully!");
      setComment("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { mutate: savePost, isPending: isSaving } = useMutation({
  mutationFn: async () => {
    try {
      const res = await fetch(`/api/posts/save/${post._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      return data; // updatedSavedPosts (array of post IDs)
    } catch (error) {
      throw new Error(error.message);
    }
  },
  onSuccess: () => {
    toast.success(isSaved ? "Post unsaved" : "Post saved successfully");
    // Update authUser cache (for savedPosts array)
    queryClient.invalidateQueries({ queryKey: ["authUser"] });
    // Remove from saved posts cache if on the saved posts page
    queryClient.setQueryData(["saved-posts"], (oldData) => {
      if (!oldData) return oldData;
      return oldData.filter((p) => p._id !== post._id);
    });
    // Update feed so bookmark icon reflects saved state
    queryClient.invalidateQueries({ queryKey: ["posts"] });
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

  const handleDeletePost = (e) => {
    e.stopPropagation();
    deletePost();
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    if (isCommenting) return;
    commentPost();
  };

  const handleLikePost = (e) => {
    e.stopPropagation();
    if (isLiking) return;
    likePost();
  };

  const handleSavePost = (e) => {
    e.stopPropagation();
    if (isSaving) return;
    savePost();
  };

  const handleSharePost = async () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;

    try {
      // Try native sharing (mobile)
      if (navigator.share) {
        await navigator.share({
          title: "Check out this post",
          url: postUrl,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(postUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      toast.error("Failed to share the post.");
      console.error("Share error:", err);
    }
  };


  const handleOpenCommentModal = (e) => {
    e.stopPropagation();
    document.getElementById(`comments_modal${post._id}`).showModal();
  };

  return (
    <div className="flex gap-2 items-start p-4 border-b border-gray-700">
      <div className="avatar">
        <Link to={`/profile/${postOwner.username}`} className="w-8 rounded-full overflow-hidden">
          <img src={postOwner.profileImg || "/avatar-placeholder.png"} alt="Profile" />
        </Link>
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex gap-2 items-center">
          <Link to={`/profile/${postOwner.username}`} className="font-bold">
            {postOwner.fullName}
          </Link>
          <span className="text-gray-700 flex gap-1 text-sm">
            <Link to={`/profile/${postOwner.username}`}>
              @{postOwner.username}
            </Link>
            <span>·</span>
            <span>{formattedDate}</span>
          </span>
          {isMyPost && (
            <span className="flex justify-end flex-1">
              {isDeleting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <FaTrash
                  className="cursor-pointer hover:text-red-500"
                  onClick={handleDeletePost}
                />
              )}
            </span>
          )}
        </div>
        <Link
          to={`/post/${post._id}`}
          className="hover:bg-secondary transition duration-300"
          aria-label={`View post by ${postOwner.username}`}
        >
          <div className="flex flex-col gap-3 overflow-hidden">
            <span>{renderTextWithMentions(post.text)}</span>
            {post.img && (
              <img
                src={post.img}
                className="h-80 object-contain rounded-lg border border-gray-700"
                alt={`Image from post by ${postOwner.username}`}
              />
            )}
          </div>
        </Link>
        <div className="flex justify-between mt-3">
          <div className="flex gap-4 items-center w-2/3 justify-between">
            <div
              className="flex gap-1 items-center cursor-pointer group"
              onClick={handleOpenCommentModal}
            >
              <FaRegComment className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
              <span className="text-sm text-slate-500 group-hover:text-sky-400">
                {post.comments.length}
              </span>
            </div>
            <dialog id={`comments_modal${post._id}`} className="modal border-none outline-none">
              <div className="modal-box rounded border border-gray-600">
                <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
                <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                  {post.comments.length === 0 && (
                    <p className="text-sm text-slate-500">
                      No comments yet 🤔 Be the first one 😉
                    </p>
                  )}
                  {post.comments.map((comment) => (
                    <div key={comment._id} className="flex gap-2 items-start">
                      <div className="avatar">
                        <div className="w-8 rounded-full">
                          <img
                            src={comment.user.profileImg || "/avatar-placeholder.png"}
                            alt={`${comment.user.username}'s profile`}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-bold">{comment.user.fullName}</span>
                          <span className="text-gray-700 text-sm">
                            @{comment.user.username}
                          </span>
                          {comment.createdAt && (
                            <span className="text-xs text-slate-500">
                              · {formatPostDate(comment.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="text-sm">{renderTextWithMentions(comment.text)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <form
                  className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                  onSubmit={handlePostComment}
                >
                  <textarea
                    className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800"
                    placeholder="Add a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                    {isCommenting ? <LoadingSpinner size="md" /> : "Post"}
                  </button>
                </form>
              </div>
              <form method="dialog" className="modal-backdrop">
                <button className="outline-none">close</button>
              </form>
            </dialog>
            <div
              className="flex gap-1 items-center group cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                handleSharePost();
              }}
            >
              <FaShare className="w-6 h-6 text-slate-500 group-hover:text-blue-800" />
            </div>

            {/** asta ii butonu de like aici */}
            <div className="flex gap-1 items-center group cursor-pointer" onClick={handleLikePost}>
              {isLiking && <LoadingSpinner size="sm" />}
              {!isLiked && !isLiking && (
                <FaRegHeart className="w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500" />
              )}
              {isLiked && !isLiking && (
                <FaHeart className="w-4 h-4 cursor-pointer text-pink-500 group-hover:text-pink-800" />
              )}
              <span
                className={`text-sm group-hover:text-pink-500 ${isLiked ? "text-pink-500 group-hover:text-pink-800" : "text-slate-500"}`}
              >
                {post.likes.length}
              </span>
            </div>
          </div>
          {/** asta ii butonu de save aici */}
          <div className="flex w-1/3 justify-end gap-2 items-center" onClick={handleSavePost}>
            {isSaving && <LoadingSpinner size="sm" />}
            {!isSaved && !isSaving && (
              <FaRegBookmark className="w-4 h-4 text-slate-500 hover:text-blue-300" />
            )}
            {isSaved && !isSaving && (
              <FaBookmark className="w-4 h-4 text-blue-500 hover:text-blue-800" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Post;