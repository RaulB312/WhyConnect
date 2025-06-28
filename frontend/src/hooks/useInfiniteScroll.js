import { useEffect, useRef } from "react";

export const useInfiniteScroll = (callback, hasNextPage, isFetchingNextPage) => {
  const observerRef = useRef();

  useEffect(() => {
    if (isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          callback();
        }
      },
      {
        threshold: 1,
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.disconnect();
      }
    };
  }, [callback, hasNextPage, isFetchingNextPage]);

  return observerRef;
};
