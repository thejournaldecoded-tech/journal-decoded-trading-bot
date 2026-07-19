import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import API_BASE_URL from "../config";

const CATEGORY_STYLES = {
  economics: "bg-blue-900/50 text-blue-300 border border-blue-700/50",
  strategy:  "bg-purple-900/50 text-purple-300 border border-purple-700/50",
  insights:  "bg-green-900/50 text-green-300 border border-green-700/50",
};

const SECTION_LABELS = {
  economics: "Economics",
  strategy: "Strategy Lab",
  insights: "Insights",
};

export function PostCard({ post }) {
  return (
    <Link
      to={`/post/${post.id}`}
      className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-700/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 flex flex-col"
    >
      {/* Image Container — uniform 16:9 */}
      <div className="post-image-container">
        {post.images && post.images.length > 0 ? (
          <img src={post.images[0].url} alt={post.images[0].caption || post.title} />
        ) : (
          <div className="post-image-placeholder">
            <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_STYLES[post.section] || "bg-gray-800 text-gray-400"}`}>
            {SECTION_LABELS[post.section] || post.section}
          </span>
          <span className="text-gray-600 text-xs">{post.read_time}</span>
        </div>

        <h2 className="text-white font-semibold text-base md:text-lg mb-2 group-hover:text-blue-400 transition-colors leading-snug">
          {post.title}
        </h2>

        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 flex-1">
          {post.summary}
        </p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
          <span className="text-gray-500 text-xs">
            {post.created_at
              ? new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : ""}
          </span>
          <span className="text-blue-400 text-xs font-medium group-hover:underline">Read →</span>
        </div>
      </div>
    </Link>
  );
}

export function PostGrid({ section, title, description }) {
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoadingPosts(true);
    fetch(`${API_BASE_URL}/api/posts?section=${section}`)
      .then((r) => r.json())
      .then((data) => { setPosts(Array.isArray(data) ? data : []); setLoadingPosts(false); })
      .catch(() => { setPosts([]); setLoadingPosts(false); });
  }, [section]);

  const filtered = useMemo(() =>
    posts.filter((p) =>
      search.trim() === "" ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.summary.toLowerCase().includes(search.toLowerCase())
    ), [posts, search]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>
        <p className="text-gray-400 text-base md:text-lg max-w-2xl">{description}</p>
      </div>

      {/* Search */}
      <div className="relative mb-8">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search articles..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
        />
      </div>

      {/* Grid */}
      {loadingPosts ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map((i) => (
            <div key={i} className="bg-gray-900 rounded-xl h-72 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No articles yet</p>
          <p className="text-sm mt-1">Check back soon — content is being added.</p>
        </div>
      )}
    </div>
  );
}
