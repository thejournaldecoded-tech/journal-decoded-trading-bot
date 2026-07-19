import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
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

function renderContent(content) {
  const lines = content.split("\n");
  const elements = [];
  let key = 0;
  let inTable = false;
  let tableRows = [];
  let inCode = false;
  let codeLines = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      const [header, , ...rows] = tableRows;
      const headers = header.split("|").filter(Boolean).map((h) => h.trim());
      elements.push(
        <div key={key++} className="overflow-x-auto my-6">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-800">
                {headers.map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-gray-300 font-semibold border border-gray-700">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                const cells = row.split("|").filter(Boolean).map((c) => c.trim());
                return (
                  <tr key={ri} className={ri % 2 === 0 ? "bg-gray-900" : "bg-gray-800/50"}>
                    {cells.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-gray-400 border border-gray-700">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  const flushCode = () => {
    if (codeLines.length > 0) {
      elements.push(
        <pre key={key++} className="bg-gray-800 border border-gray-700 rounded-xl p-4 my-6 overflow-x-auto text-green-400 text-sm font-mono leading-relaxed">
          <code>{codeLines.join("\n")}</code>
        </pre>
      );
      codeLines = [];
      inCode = false;
    }
  };

  const formatInline = (text) => {
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong class='text-white font-semibold'>$1</strong>");
    text = text.replace(/`([^`]+)`/g, "<code class='bg-gray-800 text-green-400 px-1.5 py-0.5 rounded text-sm font-mono'>$1</code>");
    return text;
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCode) { flushCode(); } else { inCode = true; }
      continue;
    }
    if (inCode) { codeLines.push(line); continue; }

    if (line.includes("|") && line.trim().startsWith("|") && line.trim().endsWith("|")) {
      inTable = true;
      tableRows.push(line);
      continue;
    }
    if (inTable) { flushTable(); }

    if (!line.trim()) {
      elements.push(<div key={key++} className="h-3" />);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={key++} className="text-xl md:text-2xl font-bold text-white mt-10 mb-4 border-b border-gray-800 pb-2">{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={key++} className="text-lg font-semibold text-blue-300 mt-6 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      elements.push(
        <li key={key++} className="ml-5 text-gray-300 leading-relaxed list-disc mb-1"
          dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
      );
    } else if (/^\d+\.\s/.test(line)) {
      elements.push(
        <li key={key++} className="ml-5 text-gray-300 leading-relaxed list-decimal mb-1"
          dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s/, "")) }} />
      );
    } else {
      elements.push(
        <p key={key++} className="text-gray-300 leading-relaxed mb-3 text-base"
          dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
      );
    }
  }

  if (inTable) flushTable();
  if (inCode) flushCode();

  return elements;
}

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    fetch(`${API_BASE_URL}/api/posts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setPost(data);
        else setPost(null);
        setLoading(false);
      })
      .catch(() => {
        setPost(null);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Article Not Found</h1>
        <p className="text-gray-400 mb-8">The article you're looking for doesn't exist.</p>
        <button onClick={() => window.history.back()} className="bg-blue-600 px-6 py-3 rounded-xl text-white hover:bg-blue-700 transition-colors">
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors text-sm mb-8"
      >
        ← Back
      </button>

      {/* Article Header */}
      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${CATEGORY_STYLES[post.section] || "bg-gray-800 text-gray-400"}`}>
            {SECTION_LABELS[post.section] || post.section}
          </span>
          <span className="text-gray-500 text-sm">{post.read_time}</span>
          <span className="text-gray-600 text-sm">·</span>
          <span className="text-gray-500 text-sm">
            {post.created_at ? new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : ""}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
          {post.title}
        </h1>

        <p className="text-gray-400 text-lg md:text-xl leading-relaxed border-l-4 border-blue-600 pl-4">
          {post.summary}
        </p>
      </header>

      {/* Images (up to 2, uniform size) */}
      {post.images && post.images.length > 0 && (
        <div className={`grid gap-4 mb-10 ${post.images.length === 1 ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          {post.images.slice(0, 2).map((img, i) => (
            <figure key={i} className="post-image-container-article">
              <img src={img.url} alt={img.caption || `Image ${i + 1}`} />
              {img.caption && (
                <figcaption className="text-center text-gray-500 text-xs mt-2 italic">
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      {/* Article Content */}
      <article className="post-article-content text-lg">
        {renderContent(post.content)}
      </article>

    </div>
  );
}
