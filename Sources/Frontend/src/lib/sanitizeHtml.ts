import createDOMPurify, { type DOMPurify } from "dompurify";

/**
 * Làm sạch HTML của bài viết tin tức trước khi render (chống stored XSS).
 * Allowlist khớp với đầu ra của trình soạn thảo Quill trong NewsManagement:
 * heading, định dạng chữ, danh sách, liên kết, ảnh.
 */
const NEWS_HTML_OPTIONS = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "h1",
    "h2",
    "h3",
    "h4",
    "ol",
    "ul",
    "li",
    "a",
    "img",
    "blockquote",
    "pre",
    "code",
    "span",
    "sub",
    "sup",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "width", "height", "class"],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|data):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
};

let browserDOMPurify: DOMPurify | undefined;

function getBrowserDOMPurify(): DOMPurify | undefined {
  if (typeof window === "undefined") return undefined;
  if (browserDOMPurify) return browserDOMPurify;

  browserDOMPurify = createDOMPurify(window);
  browserDOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if ("target" in node) {
      node.setAttribute("target", "_blank");
      node.setAttribute("rel", "noopener noreferrer");
    }
  });

  return browserDOMPurify;
}

export function sanitizeNewsHtml(html: string | null | undefined): string {
  if (!html) return "";

  // News queries currently resolve in the browser. Returning no HTML during SSR
  // is the safe fallback and avoids bundling jsdom into the Vercel ESM function.
  const DOMPurify = getBrowserDOMPurify();
  if (!DOMPurify) return "";

  return DOMPurify.sanitize(html, NEWS_HTML_OPTIONS) as string;
}
