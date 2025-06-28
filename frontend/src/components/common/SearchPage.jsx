import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Post from './Post';
import { Link } from 'react-router-dom';
import PostSkeleton from "../skeletons/RightPanelSkeleton";

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [text, setText] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [postPage, setPostPage] = useState(1);
  const [allUsers, setAllUsers] = useState([]);
  const [allPosts, setAllPosts] = useState([]);
  const USER_LIMIT = 5;
  const POST_LIMIT = 10;

  const handleSubmit = (e) => {
    e.preventDefault();
    setQuery(text.trim());
    setUserPage(1);
    setPostPage(1);
    setAllUsers([]);
    setAllPosts([]);
  };

  const { data: results, isLoading, error } = useQuery({
    queryKey: ['search', query, userPage, postPage],
    queryFn: async () => {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(query)}&userPage=${userPage}&postPage=${postPage}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      return data;
    },
    enabled: !!query,
  });

  useEffect(() => {
    if (results) {
      setAllUsers((prev) => {
        const newUsers = userPage === 1 ? results.users : [...prev, ...results.users];
        const uniqueUsers = Array.from(new Map(newUsers.map((user) => [user._id, user])).values());
        return uniqueUsers;
      });

      setAllPosts((prev) => {
        const newPosts = postPage === 1 ? results.posts : [...prev, ...results.posts];
        const uniquePosts = Array.from(new Map(newPosts.map((post) => [post._id, post])).values());
        return uniquePosts;
      });
    }
  }, [results, userPage, postPage]);

  const handleMoreUsers = () => {
    setUserPage((prev) => prev + 1);
  };

  const handleMorePosts = () => {
    setPostPage((prev) => prev + 1);
  };

  return (
    <div className="max-w-2xl w-full mx-auto px-4 mt-4">
      <form className="flex flex-col gap-2 w-full" onSubmit={handleSubmit}>
        <textarea
          className="textarea w-full p-3 text-lg resize-none border rounded-lg border-gray-300 focus:outline-none focus:ring focus:ring-blue-400"
          placeholder="Search for users or posts..."
          value={text}
          rows={2}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          className="btn bg-blue-500 text-white font-semibold py-2 rounded-md hover:bg-blue-600 transition"
        >
          Search
        </button>
      </form>

      {isLoading && !results && <div className="text-center mt-10">
        Loading ...</div>}
      {error && <div className="text-center mt-10 text-red-500">{error.message}</div>}

      {(allUsers.length > 0 || allPosts.length > 0 || results) && (
        <div className="mt-6 flex flex-col gap-6">
          {allUsers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Users</h2>
              <div className="flex flex-col gap-3">
                {allUsers.map((user) => (
                  <Link
                    key={user._id}
                    to={`/profile/${user.username}`}
                    className="flex items-center gap-3 p-2 hover:bg-gray-900 rounded-lg transition"
                  >
                    <img
                      src={user.profileImg || "/avatar-placeholder.png"}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
              {results?.users.length >= USER_LIMIT && (
                <div className="flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 cursor-pointer relative" onClick={handleMoreUsers}>
                  Show More Users
                  <svg
                    className="ml-2 w-4 h-4 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <div className='absolute bottom-0 w-10 h-1 rounded-full bg-primary'></div>
                </div>
              )}
            </div>
          )}

          {allPosts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Posts</h2>
              <div className="flex flex-col gap-4">
                {allPosts.map((post) => (
                  <Post key={post._id} post={post} />
                ))}
              </div>
              {results?.posts.length >= POST_LIMIT && (
                <div className="flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 cursor-pointer relative" onClick={handleMorePosts}>
                  Show More Posts
                  <svg
                    className="ml-2 w-4 h-4 inline-block"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <div className='absolute bottom-0 w-10 h-1 rounded-full bg-primary'></div>
                </div>

              )}
            </div>
          )}

          {allUsers.length === 0 && allPosts.length === 0 && results && (
            <div className="text-center text-gray-500">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchPage;