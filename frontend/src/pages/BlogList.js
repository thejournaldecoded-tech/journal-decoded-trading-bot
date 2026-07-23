import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import blogs from "../data/blogs.json";

const CATEGORIES = ["All", "Macroeconomics", "Stock Market", "Crypto", "Technical Analysis"];

const CATEGORY_COLORS = {
  "Macroeconomics": "bg-blue-900/50 text-blue-300 border border-blue-700/50",
  "Stock Market": "bg-green-900/50 text-green-300 border border-green-700/50",
  "Crypto": "bg-orange-900/50 text-orange-300 border border-orange-700/50",
  "Technical Analysis": "bg-purple-900/50 text-purple-300 border border-purple-700/50",
};

function BlogCard({ post }) {
  return (
    <Link
      to={`/economics/${post.id}`}
      className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-blue-700/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-900/20 flex flex-col"
    >
      {/* Image or placeholder */}
      <div className="blog-image-container">
        {post.images && post.images.length > 0 ? (
          <img src={post.images[0].url} alt={post.images[0].caption || post.title} />
        ) : (
          <div className="blog-image-placeholder">
            <svg className="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-gray-600 text-xs mt-2">{post.category}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${CATEGORY_COLORS[post.category] || "bg-gray-800 text-gray-400"}`}>
            {post.category}
          </span>
          <span className="text-gray-600 text-xs">{post.readTime}</span>
        </div>

        <h2 className="text-white font-semibold text-base md:text-lg mb-2 group-hover:text-blue-400 transition-colors leading-snug">
          {post.title}
        </h2>

        <p className="text-gray-400 text-sm leading-relaxed line-clamp-3 flex-1">
          {post.summary}
        </p>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-800">
          <span className="text-gray-500 text-xs">{new Date(post.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
          <span className="text-blue-400 text-xs font-medium group-hover:underline">Read →</span>
        </div>
      </div>
    </Link>
  );
}

function BlogList() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = useMemo(() => {
    return blogs.filter((post) => {
      const matchCat = activeCategory === "All" || post.category === activeCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Knowledge Base
        </h1>
        <p className="text-gray-400 text-base md:text-lg max-w-2xl">
          Finance, economics, and market concepts explained clearly — for investors at every level.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors text-sm"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              activeCategory === cat
                ? "bg-blue-600 text-white shadow-md shadow-blue-900/40"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((post) => (
            <BlogCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">No articles found</p>
          <p className="text-sm mt-1">Try a different search or category</p>
        </div>
      )}
    </div>
  );
}

export default BlogList;
