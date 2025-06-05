import { useQuery } from "@tanstack/react-query";
import Post from "./Post";
import toast from "react-hot-toast";

const SavedPage = () => {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts/saved");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch saved posts");
      return data;
    },
  });

  if (isLoading) return <div className="text-center mt-10">Loading saved posts...</div>;
  if (error) return <div className="text-center mt-10 text-red-500">Error loading saved posts</div>;
  if (posts.length === 0) return <div className="text-center mt-10">No saved posts</div>;

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <Post key={post._id} post={post} />
      ))}
    </div>
  );
};

export default SavedPage;
