import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

const SECTIONS = [
  { value: "economics", label: "📊 Economics", desc: "Macro concepts, finance terms, interest rates, inflation" },
  { value: "strategy", label: "📈 Strategy Lab", desc: "Trading strategies, technical setups, chart patterns" },
  { value: "insights", label: "💡 Insights", desc: "Market analysis, opinions, news commentary" },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    summary: "",
    content: "",
    section: "economics",
    read_time: "5 min read",
    images: [],
  });

  const [imageInput, setImageInput] = useState({ url: "", caption: "" });

  // Check admin access on mount
  useEffect(() => {
    const token = localStorage.getItem("jwt_token");
    if (!token) { navigate("/login"); return; }
    fetch(`${API_BASE_URL}/api/admin/check`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.is_admin) setIsAdmin(true);
        else setIsAdmin(false);
      })
      .catch(() => setIsAdmin(false));
  }, [navigate]);

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const addImage = () => {
    if (!imageInput.url.trim()) return;
    setForm((f) => ({ ...f, images: [...f.images, { ...imageInput }] }));
    setImageInput({ url: "", caption: "" });
  };

  const removeImage = (i) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      const res = await fetch(`${API_BASE_URL}/api/posts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        setSuccess(`✅ Post published to ${data.section.toUpperCase()}! Post ID: ${data.post_id}`);
        setForm({ title: "", summary: "", content: "", section: "economics", read_time: "5 min read", images: [] });
      } else {
        setError(data.detail || "Failed to publish post.");
      }
    } catch (err) {
      setError("Could not connect to server.");
    }
    setLoading(false);
  };

  if (isAdmin === null) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Access Required</h1>
        <p className="text-gray-400">You don't have admin privileges. Contact the site owner.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-1">Admin Panel</h1>
        <p className="text-gray-400">Publish articles to Economics, Strategy Lab, or Insights</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Publish To <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SECTIONS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => handleChange("section", s.value)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  form.section === s.value
                    ? "border-blue-500 bg-blue-600/20 text-white"
                    : "border-gray-700 bg-gray-900 text-gray-400 hover:border-gray-600"
                }`}
              >
                <div className="font-semibold text-sm mb-1">{s.label}</div>
                <div className="text-xs opacity-70">{s.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Title <span className="text-red-400">*</span></label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="e.g. What is Inflation? A Complete Guide"
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Summary / Excerpt <span className="text-red-400">*</span></label>
          <textarea
            required
            rows={2}
            value={form.summary}
            onChange={(e) => handleChange("summary", e.target.value)}
            placeholder="One or two sentence description shown on the article card..."
            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Read Time */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Read Time</label>
          <input
            type="text"
            value={form.read_time}
            onChange={(e) => handleChange("read_time", e.target.value)}
            placeholder="5 min read"
            className="w-48 p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Article Content <span className="text-red-400">*</span>
            <span className="ml-2 text-xs text-gray-500 font-normal">Supports Markdown: **bold**, ## Heading, - bullet, | tables |</span>
          </label>
          <textarea
            required
            rows={18}
            value={form.content}
            onChange={(e) => handleChange("content", e.target.value)}
            placeholder={`## Introduction\n\nWrite your article here. Use Markdown:\n\n**Bold text** for emphasis\n\n## Section Heading\n\nParagraph text...\n\n- Bullet point\n- Another point\n\n| Column 1 | Column 2 |\n|----------|----------|\n| Row 1    | Value    |`}
            className="w-full p-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 font-mono text-sm leading-relaxed resize-y"
          />
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Images (optional, max 2)
          </label>
          {form.images.length < 2 && (
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="url"
                value={imageInput.url}
                onChange={(e) => setImageInput((i) => ({ ...i, url: e.target.value }))}
                placeholder="Image URL (https://...)"
                className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              <input
                type="text"
                value={imageInput.caption}
                onChange={(e) => setImageInput((i) => ({ ...i, caption: e.target.value }))}
                placeholder="Caption (optional)"
                className="sm:w-48 p-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
              >
                + Add Image
              </button>
            </div>
          )}
          {form.images.map((img, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-800 rounded-xl p-3 mb-2">
              <div className="w-16 h-10 bg-gray-700 rounded overflow-hidden flex-shrink-0">
                <img src={img.url} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display = "none"} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs truncate">{img.url}</p>
                {img.caption && <p className="text-gray-400 text-xs">{img.caption}</p>}
              </div>
              <button type="button" onClick={() => removeImage(i)} className="text-red-400 hover:text-red-300 text-sm px-2">✕</button>
            </div>
          ))}
          <p className="text-gray-600 text-xs mt-1">All images will be displayed in uniform 16:9 containers regardless of original dimensions.</p>
        </div>

        {/* Feedback */}
        {error && <div className="bg-red-900/30 border border-red-700/50 text-red-300 p-4 rounded-xl text-sm">{error}</div>}
        {success && <div className="bg-green-900/30 border border-green-700/50 text-green-300 p-4 rounded-xl text-sm">{success}</div>}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-base"
        >
          {loading ? "Publishing..." : `Publish to ${SECTIONS.find((s) => s.value === form.section)?.label}`}
        </button>
      </form>
    </div>
  );
}
