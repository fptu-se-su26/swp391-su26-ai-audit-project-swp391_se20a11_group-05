import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

export interface NewsRichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  modules: Record<string, unknown>;
  className?: string;
  placeholder?: string;
}

export default function NewsRichTextEditor(props: NewsRichTextEditorProps) {
  return <ReactQuill theme="snow" {...props} />;
}
