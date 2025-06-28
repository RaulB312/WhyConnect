import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { usePaginatedPosts } from "../../hooks/usePaginatedPosts";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";

const Posts = ({ feedType, username, userId }) => {
  const { posts, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    usePaginatedPosts({ feedType, username, userId });

  const observerRef = useInfiniteScroll(fetchNextPage, hasNextPage, isFetchingNextPage);

  return (
    <>
      {isLoading && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && posts.length === 0 && (
        <p className="text-center my-4">No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && posts && (
        <div>
          {posts.map((post, index) => {
            // Attach observer to the last post
            if (index === posts.length - 1) {
              return (
                <div ref={observerRef} key={post._id}>
                  <Post post={post} />
                </div>
              );
            }
            return <Post key={post._id} post={post} />;
          })}
          {isFetchingNextPage && (
            <div className="flex justify-center my-4">
              <PostSkeleton />
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Posts;
