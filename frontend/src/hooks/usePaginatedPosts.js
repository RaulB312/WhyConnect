import { useInfiniteQuery } from "@tanstack/react-query";

const getEndpoint = ({ feedType, username, userId }) => {
  switch (feedType) {
    case "forYou":
      return "/api/posts/all";
    case "following":
      return "/api/posts/following";
    case "posts":
      return `/api/posts/user/${username}`;
    case "likes":
      return `/api/posts/likes/${userId}`;
    default:
      return "/api/posts/all";
  }
};

export const usePaginatedPosts = ({ feedType, username, userId }) => {
  const endpoint = getEndpoint({ feedType, username, userId });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ["posts", feedType, username, userId],
    queryFn: async ({ pageParam = null }) => {
      const url = pageParam ? `${endpoint}?cursor=${pageParam}&limit=10` : `${endpoint}?limit=10`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch posts");
      }
      const posts = await res.json();
      return posts;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1]._id;
    },
  });

  return {
    posts: data?.pages.flat() || [],
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  };
};
