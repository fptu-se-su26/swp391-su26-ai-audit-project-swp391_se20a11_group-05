import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, Smile, ThumbsUp, Heart, Box, Sun } from "lucide-react";

type EmojiItem = {
  char: string;
  name: string;
  keywords: string[];
};

const EMOJI_CATEGORIES = [
  {
    id: "smileys",
    label: "Biểu cảm",
    icon: Smile,
    emojis: [
      { char: "😂", name: "cười ra nước mắt", keywords: ["cười", "cuoi", "haha", "joy", "tear"] },
      { char: "🤣", name: "cười lăn lộn", keywords: ["cười", "cuoi", "rofl", "rolling"] },
      {
        char: "😊",
        name: "mỉm cười hạnh phúc",
        keywords: ["cười", "cuoi", "smile", "happy", "vui"],
      },
      { char: "😍", name: "mắt trái tim", keywords: ["yêu", "love", "heart", "thích", "dep"] },
      {
        char: "🥰",
        name: "yêu thương ngập tràn",
        keywords: ["yêu", "love", "hearts", "hạnh phúc"],
      },
      { char: "😘", name: "hôn", keywords: ["kiss", "hon", "yêu", "love"] },
      { char: "😜", name: "nháy mắt thè lưỡi", keywords: ["trêu", "winking", "tongue"] },
      { char: "🤔", name: "suy nghĩ", keywords: ["suy nghi", "think", "wonder"] },
      { char: "😅", name: "cười trừ gượng gạo", keywords: ["ngại", "cười", "sweat", "grin"] },
      { char: "😎", name: "đeo kính ngầu", keywords: ["ngầu", "cool", "sunglasses"] },
      { char: "😢", name: "khóc", keywords: ["khóc", "sad", "cry", "buồn"] },
      { char: "😡", name: "tức giận", keywords: ["giận", "angry", "mad", "tuc"] },
      { char: "😱", name: "hốt hoảng", keywords: ["sợ", "scared", "scream"] },
      { char: "😴", name: "buồn ngủ", keywords: ["ngủ", "sleep", "zzz"] },
      { char: "😷", name: "đeo khẩu trang", keywords: ["ốm", "mask", "sick"] },
    ],
  },
  {
    id: "people",
    label: "Cử chỉ",
    icon: ThumbsUp,
    emojis: [
      { char: "👍", name: "thích (like)", keywords: ["like", "thích", "ok", "thumbsup", "tot"] },
      { char: "👎", name: "không thích", keywords: ["dislike", "thumbsdown", "chê"] },
      { char: "👌", name: "đồng ý (ok)", keywords: ["ok", "perfect", "okay"] },
      { char: "✌️", name: "chiến thắng", keywords: ["victory", "peace", "hi"] },
      { char: "👏", name: "vỗ tay", keywords: ["vỗ tay", "clap", "bravo"] },
      { char: "🙌", name: "ăn mừng", keywords: ["celebrate", "hands"] },
      { char: "🙏", name: "cảm ơn / cầu nguyện", keywords: ["cam on", "please", "pray", "thanks"] },
      { char: "🤝", name: "bắt tay", keywords: ["bat tay", "handshake", "agree"] },
      { char: "👋", name: "vẫy tay", keywords: ["xin chao", "wave", "hello", "bye"] },
      { char: "💪", name: "cố lên", keywords: ["mạnh mẽ", "muscle", "power", "strong"] },
      { char: "🙋‍♂️", name: "nam giơ tay", keywords: ["giơ tay", "man", "ask"] },
      { char: "🙋‍♀️", name: "nữ giơ tay", keywords: ["giơ tay", "woman", "ask"] },
    ],
  },
  {
    id: "hearts",
    label: "Ký hiệu",
    icon: Heart,
    emojis: [
      { char: "❤️", name: "tim đỏ", keywords: ["tim", "heart", "love", "yêu"] },
      { char: "💖", name: "tim lấp lánh", keywords: ["tim", "sparkling", "love"] },
      { char: "💙", name: "tim xanh dương", keywords: ["tim", "blue", "heart"] },
      { char: "💚", name: "tim xanh lá", keywords: ["tim", "green", "heart"] },
      { char: "💛", name: "tim vàng", keywords: ["tim", "yellow", "heart"] },
      { char: "💜", name: "tim tím", keywords: ["tim", "purple", "heart"] },
      { char: "🖤", name: "tim đen", keywords: ["tim", "black", "heart"] },
      { char: "✨", name: "lấp lánh", keywords: ["lap lanh", "sparkles", "star"] },
      { char: "🔥", name: "lửa hot", keywords: ["hot", "fire", "cháy", "hot"] },
      { char: "⭐", name: "ngôi sao", keywords: ["sao", "star", "gold"] },
      { char: "🎉", name: "pháo hoa", keywords: ["chúc mừng", "party", "celebrate"] },
      { char: "🚀", name: "tên lửa", keywords: ["rocket", "bay", "nhanh"] },
      { char: "💡", name: "ý tưởng", keywords: ["ý tưởng", "idea", "lightbulb"] },
    ],
  },
  {
    id: "objects",
    label: "Đồ vật",
    icon: Box,
    emojis: [
      { char: "📍", name: "ghim vị trí", keywords: ["vị trí", "location", "pin", "ban do"] },
      { char: "🗺️", name: "bản đồ", keywords: ["bản đồ", "map", "duong đi"] },
      { char: "🚗", name: "ô tô", keywords: ["oto", "xe hoi", "car"] },
      { char: "🚲", name: "xe đạp", keywords: ["xe dap", "bike"] },
      { char: "📱", name: "điện thoại", keywords: ["dienthoai", "phone", "mobile"] },
      { char: "💻", name: "máy tính", keywords: ["computer", "laptop", "pc"] },
      { char: "✉️", name: "thư", keywords: ["thu", "email", "mail"] },
      { char: "📝", name: "ghi chú", keywords: ["ghi chu", "note", "write"] },
      { char: "📅", name: "lịch", keywords: ["lich", "calendar", "date"] },
      { char: "🔔", name: "chuông thông báo", keywords: ["chuong", "bell", "notify"] },
      { char: "🎁", name: "quà tặng", keywords: ["qua", "gift", "present"] },
      { char: "🏆", name: "cúp", keywords: ["cup", "trophy", "win"] },
    ],
  },
  {
    id: "weather",
    label: "Môi trường",
    icon: Sun,
    emojis: [
      { char: "☀️", name: "nắng mặt trời", keywords: ["nang", "sun", "hot"] },
      { char: "🌧️", name: "mưa", keywords: ["mua", "rain"] },
      { char: "❄️", name: "tuyết", keywords: ["tuyet", "snow", "cold"] },
      { char: "⚡", name: "sét", keywords: ["set", "lightning", "danger"] },
      { char: "🍀", name: "cỏ 4 lá", keywords: ["may man", "clover", "green"] },
      { char: "🌸", name: "hoa đào", keywords: ["hoa", "flower", "cherry"] },
      { char: "🌳", name: "cây xanh", keywords: ["cay", "tree", "forest"] },
      { char: "🌊", name: "sóng biển", keywords: ["bien", "wave", "water"] },
      { char: "🌍", name: "trái đất", keywords: ["trai dat", "earth", "world"] },
      { char: "♻️", name: "tái chế", keywords: ["tai che", "recycle", "green"] },
    ],
  },
];

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  disabled?: boolean;
  triggerSize?: number;
  triggerClassName?: string;
}

export function EmojiPicker({
  onSelectEmoji,
  disabled = false,
  triggerSize = 19,
  triggerClassName,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("smileys");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase().trim();
    const results: EmojiItem[] = [];
    EMOJI_CATEGORIES.forEach((cat) => {
      cat.emojis.forEach((emoji) => {
        if (
          emoji.name.toLowerCase().includes(query) ||
          emoji.keywords.some((kw) => kw.toLowerCase().includes(query))
        ) {
          results.push(emoji);
        }
      });
    });
    return results;
  }, [searchQuery]);

  const handleEmojiClick = (char: string) => {
    onSelectEmoji(char);
    // Keep popover open for multi-insertion, but can close if preferred
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={
            triggerClassName ||
            "grid h-10 w-10 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-[#3B82F6] disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-500 cursor-pointer"
          }
          title="Chọn emoji"
          aria-label="Chọn emoji"
        >
          <Smile size={triggerSize} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-72 p-0 rounded-2xl border border-slate-100 bg-white/95 backdrop-blur-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Search Header */}
        <div className="p-3 border-b border-slate-100/85 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm emoji..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-200/80 outline-none transition focus:bg-white focus:border-indigo-500/80 text-slate-700 placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Categories Tabs */}
        {!searchQuery && (
          <div className="flex justify-around border-b border-slate-100 bg-slate-50/50 p-1">
            {EMOJI_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  title={cat.label}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-indigo-650 shadow-sm border border-slate-200/40"
                      : "text-slate-400 hover:text-slate-650 hover:bg-slate-200/40"
                  }`}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>
        )}

        {/* Emoji Area */}
        <div className="p-3 max-h-48 overflow-y-auto">
          {searchQuery ? (
            filteredEmojis && filteredEmojis.length > 0 ? (
              <div className="grid grid-cols-6 gap-2">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={`${emoji.char}-${index}`}
                    type="button"
                    onClick={() => handleEmojiClick(emoji.char)}
                    title={emoji.name}
                    className="h-8 w-8 text-xl grid place-items-center rounded-lg hover:bg-slate-100 transition active:scale-90 cursor-pointer"
                  >
                    {emoji.char}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs font-semibold text-slate-450">
                Không tìm thấy emoji phù hợp
              </div>
            )
          ) : (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.label}
              </div>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_CATEGORIES.find((c) => c.id === activeCategory)?.emojis.map((emoji) => (
                  <button
                    key={emoji.char}
                    type="button"
                    onClick={() => handleEmojiClick(emoji.char)}
                    title={emoji.name}
                    className="h-8 w-8 text-xl grid place-items-center rounded-lg hover:bg-slate-100 transition active:scale-90 cursor-pointer"
                  >
                    {emoji.char}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
