import DOMPurify from "isomorphic-dompurify";

/**
 * Làm sạch HTML của bài viết tin tức trước khi render (chống stored XSS).
 * Allowlist khớp với đầu ra của trình soạn thảo Quill trong NewsManagement:
 * heading, định dạng chữ, danh sách, liên kết, ảnh.
 */
const NEWS_HTML_OPTIONS = {
  ALLOWED_TAGS: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
    "h1", "h2", "h3", "h4",
    "ol", "ul", "li",
    "a", "img", "blockquote", "pre", "code", "span", "sub", "sup",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "width", "height", "class"],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

// Add a hook to enforce target="_blank" on links
if (typeof DOMPurify.addHook === 'function') {
  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if ("target" in node) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });
}

export function sanitizeNewsHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, NEWS_HTML_OPTIONS) as string;
}
