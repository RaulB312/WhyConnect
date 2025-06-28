import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export const useLikePost = () => {
  const queryClient = useQueryClient();

  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async (postId) => {
      try {
        const res = await fetch(`/api/posts/like/${postId}`, {
          method: 'POST',
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Something went wrong');
        }
        return { postId, likes: data }; // <-- backend returns updated likes array
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: ({ postId, likes }) => {
      const updatePostInCache = (queryKey) => {
        queryClient.setQueriesData({ queryKey }, (oldData) => {
          if (!oldData) return oldData;

          // Handle infinite queries (search, home, saved, etc)
          if (oldData.pages) {
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                posts: page.posts.map((p) =>
                  p._id === postId ? { ...p, likes } : p
                ),
              })),
            };
          }

          // Handle non-infinite queries (single post, profile, etc)
          if (Array.isArray(oldData)) {
            return oldData.map((p) => (p._id === postId ? { ...p, likes } : p));
          }

          // Handle single post object
          if (oldData._id === postId) {
            return { ...oldData, likes };
          }

          return oldData;
        });
      };

      // Now update likes in any cache slice where post may exist:
      updatePostInCache(['posts']);            // home feed
      updatePostInCache(['saved-posts']);      // saved posts
      updatePostInCache(['post', postId]);     // single post page
      updatePostInCache(['search-posts']);     // search posts
      updatePostInCache(['search']);           // (if still using old search key anywhere)
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return { likePost, isLiking };
};
