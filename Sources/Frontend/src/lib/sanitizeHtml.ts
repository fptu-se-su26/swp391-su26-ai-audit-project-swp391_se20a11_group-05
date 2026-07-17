import sanitizeHtml from "sanitize-html";

/**
 * Làm sạch HTML của bài viết tin tức trước khi render (chống stored XSS).
 * Allowlist khớp với đầu ra của trình soạn thảo Quill trong NewsManagement:
 * heading, định dạng chữ, danh sách, liên kết, ảnh.
 */
const NEWS_HTML_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "strike",
    "h1", "h2", "h3", "h4",
    "ol", "ul", "li",
    "a", "img", "blockquote", "pre", "code", "span", "sub", "sup",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  // Quill dùng class ql-* cho căn lề, thụt đầu dòng
  allowedClasses: { "*": [/^ql-/] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Ảnh nhúng từ Quill là data URL base64
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      target: "_blank",
      rel: "noopener noreferrer",
    }),
  },
};

export function sanitizeNewsHtml(html: string | null | undefined): string {
  return sanitizeHtml(html ?? "", NEWS_HTML_OPTIONS);
}
