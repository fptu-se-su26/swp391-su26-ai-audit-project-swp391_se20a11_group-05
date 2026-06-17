/**
 * Campaign Store — shared in-memory + localStorage state
 *
 * Cho phép trang chi tiết phản ánh (my-reports.$id) tạo chiến dịch
 * và trang danh sách/chi tiết chiến dịch (campaigns.*) đọc dữ liệu đó ngay lập tức.
 *
 * Cơ chế: localStorage + BroadcastChannel/custom event để sync cross-tab.
 */

export type CampaignCategory =
  | "environment"
  | "infrastructure"
  | "public_safety"
  | "construction"
  | "fire_safety";

export type CampaignStatus = "pending_review" | "recruiting" | "inProgress" | "completed";

export interface Campaign {
  id: string;
  name: string;
  nameEn: string;
  category: CampaignCategory;
  status: CampaignStatus;
  ward: string;
  createdBy: string;
  createdByEn: string;
  participants: number;
  target: number;
  progress: number;
  reports: number;
  daysLeft: number;
  impactScore: number;
  affectedCitizens: number;
  cover: string;
  desc: string;
  descEn: string;
  featured: boolean;
  linkedFeedbackId?: string | number | null;
  linkedFeedbackCode?: string | null;
  linkedFeedbackTitle?: string | null;
  startTime?: string;
  endTime?: string;
  locationText?: string;
  createdAt: string;
}

// ─── Cover images by category ─────────────────────────────────
const COVER_BY_CATEGORY: Record<CampaignCategory, string> = {
  environment:
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
  infrastructure:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
  public_safety:
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
  construction:
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=600&q=80",
  fire_safety:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
};

// ─── Default seed data (same as campaigns.index.tsx CAMPAIGNS) ──
const SEED_CAMPAIGNS: Campaign[] = [
  {
    id: "green-hoa-xuan",
    name: "Chiến dịch Xanh Hòa Xuân",
    nameEn: "Green Hoa Xuan Campaign",
    category: "environment",
    status: "inProgress",
    ward: "Hòa Xuân",
    createdBy: "Đoàn TN & UBND Phường",
    createdByEn: "Youth Union & Ward Authority",
    participants: 42,
    target: 50,
    progress: 68,
    reports: 18,
    daysLeft: 12,
    impactScore: 8.5,
    affectedCitizens: 1245,
    cover: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
    desc: "Dọn dẹp các điểm xả rác tự phát, cải tạo mương thoát nước và tôn tạo không gian xanh.",
    descEn: "Cleanup illegal dumping sites, restore drainage canals, and improve green spaces.",
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "beach-cleanup-my-khe",
    name: "Làm sạch bãi biển Mỹ Khê",
    nameEn: "Beach Cleanup My Khe",
    category: "environment",
    status: "recruiting",
    ward: "Mỹ An",
    createdBy: "Hội Liên hiệp Thanh niên",
    createdByEn: "Youth Federation",
    participants: 18,
    target: 80,
    progress: 22,
    reports: 11,
    daysLeft: 21,
    impactScore: 9.1,
    affectedCitizens: 2800,
    cover: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
    desc: "Vệ sinh đường bờ biển Mỹ Khê, thu gom rác nhựa và nâng cao ý thức bảo vệ biển.",
    descEn: "Clean My Khe shoreline, collect plastic waste and raise ocean protection awareness.",
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "drainage-restoration",
    name: "Cải tạo hệ thống thoát nước Hải Châu",
    nameEn: "Drainage Restoration Hai Chau",
    category: "infrastructure",
    status: "inProgress",
    ward: "Hải Châu 1",
    createdBy: "UBND Q. Hải Châu",
    createdByEn: "Hai Chau District Authority",
    participants: 35,
    target: 45,
    progress: 78,
    reports: 24,
    daysLeft: 7,
    impactScore: 7.8,
    affectedCitizens: 4150,
    cover: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80",
    desc: "Khơi thông, nạo vét cống rãnh tại các điểm ngập lụt nghiêm trọng khu vực nội đô.",
    descEn: "Dredge and restore blocked drains at severe flood-prone areas in the city centre.",
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "community-safety",
    name: "An toàn cộng đồng Thanh Khê",
    nameEn: "Community Safety Awareness Thanh Khe",
    category: "public_safety",
    status: "recruiting",
    ward: "Thanh Khê Đông",
    createdBy: "Công an Phường",
    createdByEn: "Ward Police",
    participants: 9,
    target: 30,
    progress: 30,
    reports: 8,
    daysLeft: 28,
    impactScore: 6.9,
    affectedCitizens: 1860,
    cover: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
    desc: "Tuyên truyền phòng chống tội phạm, lắp camera an ninh và nâng cao ý thức dân cư.",
    descEn: "Crime prevention outreach, security camera installation and community awareness.",
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "tree-planting",
    name: "Chương trình Trồng cây Đà Nẵng Xanh",
    nameEn: "Da Nang Tree Planting Program",
    category: "environment",
    status: "completed",
    ward: "Hòa Khánh Bắc",
    createdBy: "Sở Tài nguyên Môi trường",
    createdByEn: "Dept. of Natural Resources",
    participants: 120,
    target: 100,
    progress: 100,
    reports: 6,
    daysLeft: 0,
    impactScore: 9.7,
    affectedCitizens: 6200,
    cover: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=600&q=80",
    desc: "Trồng 4,500 cây xanh bóng mát dọc các tuyến đường chính và công viên thành phố.",
    descEn: "Planted 4,500 shade trees along main roads and city parks.",
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "illegal-ads-removal",
    name: "Xoá biển quảng cáo sai phép Ngũ Hành Sơn",
    nameEn: "Illegal Advertising Removal Ngu Hanh Son",
    category: "infrastructure",
    status: "inProgress",
    ward: "Ngũ Hành Sơn",
    createdBy: "Thanh tra Xây dựng",
    createdByEn: "Construction Inspectorate",
    participants: 22,
    target: 25,
    progress: 88,
    reports: 15,
    daysLeft: 4,
    impactScore: 7.2,
    affectedCitizens: 3200,
    cover: "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=600&q=80",
    desc: "Tháo dỡ toàn bộ biển quảng cáo không phép gây mất mỹ quan đô thị khu du lịch.",
    descEn: "Remove all unlicensed banners and billboards degrading the urban and tourism landscape.",
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "neighborhood-beautification",
    name: "Làm đẹp Khu phố Liên Chiểu",
    nameEn: "Neighborhood Beautification Lien Chieu",
    category: "environment",
    status: "recruiting",
    ward: "Liên Chiểu",
    createdBy: "Tổ dân phố số 7",
    createdByEn: "Neighborhood Team No.7",
    participants: 5,
    target: 40,
    progress: 12,
    reports: 9,
    daysLeft: 35,
    impactScore: 6.5,
    affectedCitizens: 980,
    cover: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&q=80",
    desc: "Sơn tường ngõ hẻm, trồng hoa dọc vỉa hè và lắp đèn chiếu sáng trang trí.",
    descEn: "Paint alleyway murals, plant flowers along sidewalks, and install decorative lighting.",
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: "public-facility-repair",
    name: "Sửa chữa cơ sở hạ tầng công cộng Cẩm Lệ",
    nameEn: "Public Facility Repair Cam Le",
    category: "infrastructure",
    status: "completed",
    ward: "Cẩm Lệ",
    createdBy: "UBND Q. Cẩm Lệ",
    createdByEn: "Cam Le District Authority",
    participants: 56,
    target: 50,
    progress: 100,
    reports: 31,
    daysLeft: 0,
    impactScore: 8.9,
    affectedCitizens: 5400,
    cover: "https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=600&q=80",
    desc: "Sửa chữa đèn đường hỏng, nắp cống, vỉa hè sụt lún và biển chỉ đường mờ nhạt.",
    descEn: "Repaired broken streetlights, manhole covers, sunken pavements and faded road signs.",
    featured: false,
    createdAt: new Date().toISOString(),
  },
];

// ─── Storage key ──────────────────────────────────────────────
const STORAGE_KEY = "dn_campaigns_v1";
const STORE_EVENT = "dn_campaigns_updated";

// ─── Read / Write helpers ─────────────────────────────────────

function readStorage(): Campaign[] {
  if (typeof window === "undefined") return SEED_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_CAMPAIGNS;
    const parsed = JSON.parse(raw) as Campaign[];
    // Merge: keep seed campaigns + any user-created ones not in seed
    const seedIds = new Set(SEED_CAMPAIGNS.map((c) => c.id));
    const userCreated = parsed.filter((c) => !seedIds.has(c.id));
    return [...SEED_CAMPAIGNS, ...userCreated];
  } catch {
    return SEED_CAMPAIGNS;
  }
}

function writeStorage(campaigns: Campaign[]) {
  if (typeof window === "undefined") return;
  // Only persist user-created (non-seed) campaigns to keep storage small
  const seedIds = new Set(SEED_CAMPAIGNS.map((c) => c.id));
  const userCreated = campaigns.filter((c) => !seedIds.has(c.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userCreated));
  // Notify other components in the same tab
  window.dispatchEvent(new Event(STORE_EVENT));
}

// ─── Public API ───────────────────────────────────────────────

/** Get all campaigns (seed + user-created) */
export function getCampaigns(): Campaign[] {
  return readStorage();
}

/** Get a single campaign by id */
export function getCampaignById(id: string): Campaign | undefined {
  return readStorage().find((c) => c.id === id);
}

/** Create a new campaign and persist it */
export function createCampaign(params: {
  title: string;
  description: string;
  category: CampaignCategory;
  locationText?: string;
  maxParticipants?: string;
  startTime?: string;
  endTime?: string;
  linkedFeedbackId?: string | number | null;
  linkedFeedbackCode?: string | null;
  linkedFeedbackTitle?: string | null;
  wardName?: string;
}): Campaign {
  const id = `user-${Date.now()}`;
  const target = parseInt(params.maxParticipants || "30", 10) || 30;

  // Estimate daysLeft from endTime
  let daysLeft = 30;
  if (params.endTime) {
    const diff = new Date(params.endTime).getTime() - Date.now();
    daysLeft = Math.max(0, Math.round(diff / 86_400_000));
  }

  const newCampaign: Campaign = {
    id,
    name: params.title,
    nameEn: params.title,
    category: params.category,
    status: "pending_review",
    ward: params.wardName || "Đà Nẵng",
    createdBy: "Người dân",
    createdByEn: "Citizen",
    participants: 0,
    target,
    progress: 0,
    reports: params.linkedFeedbackId ? 1 : 0,
    daysLeft,
    impactScore: 0,
    affectedCitizens: 0,
    cover: COVER_BY_CATEGORY[params.category],
    desc: params.description,
    descEn: params.description,
    featured: false,
    linkedFeedbackId: params.linkedFeedbackId,
    linkedFeedbackCode: params.linkedFeedbackCode,
    linkedFeedbackTitle: params.linkedFeedbackTitle,
    startTime: params.startTime,
    endTime: params.endTime,
    locationText: params.locationText,
    createdAt: new Date().toISOString(),
  };

  const current = readStorage();
  writeStorage([...current, newCampaign]);
  return newCampaign;
}

// ─── Comment Types & Store ────────────────────────────────────

export interface CampaignComment {
  id: string;
  author: string;
  role: string;
  avatar: string;
  time: string;
  text: string;
  likes: number;
  replies: {
    id: string;
    author: string;
    role: string;
    avatar: string;
    time: string;
    text: string;
  }[];
}

const COMMENT_KEY_PREFIX = "dn_comments_";

/** Seed comments per campaign id */
const SEED_COMMENTS: Record<string, CampaignComment[]> = {
  "green-hoa-xuan": [
    {
      id: "c-ghx-1",
      author: "Nguyễn Văn Hùng",
      role: "Trưởng nhóm TNV Tổ 1",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80",
      time: "10 phút trước",
      text: "Bên mình đã dọn xong đoạn kênh hở số 2 rồi nhé mọi người. Lượng rác nhựa ở đây nhiều khủng khiếp!",
      likes: 14,
      replies: [
        {
          id: "c-ghx-1-r1",
          author: "UBND Phường Hòa Xuân",
          role: "Ban quản lý",
          avatar: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=100&q=80",
          time: "5 phút trước",
          text: "Cảm ơn nỗ lực tuyệt vời của Tổ 1! Xe chở rác chuyên dụng đang trên đường đến điểm tập kết rác tạm để vận chuyển đi.",
        },
      ],
    },
    {
      id: "c-ghx-2",
      author: "Trần Thị Lan",
      role: "Người dân Hòa Xuân",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80",
      time: "1 giờ trước",
      text: "Rất hoan nghênh chiến dịch này. Khu phố nhà mình sạch sẽ hẳn ra, không còn mùi hôi thối bốc lên từ mương nữa.",
      likes: 8,
      replies: [],
    },
  ],
  "beach-cleanup-my-khe": [
    {
      id: "c-bc-1",
      author: "Lê Minh Tuấn",
      role: "Tình nguyện viên",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80",
      time: "2 giờ trước",
      text: "Bãi biển Mỹ Khê đang rất cần chúng ta! Mình đã đăng ký tham gia đợt cuối tuần này rồi.",
      likes: 22,
      replies: [],
    },
  ],
  "community-safety": [
    {
      id: "c-cs-1",
      author: "Công an Phường",
      role: "Ban tổ chức",
      avatar: "https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=100&q=80",
      time: "3 giờ trước",
      text: "Chiến dịch đang tuyển thêm tình nguyện viên tuần tra ban đêm. Bà con quan tâm liên hệ trực tiếp nhé.",
      likes: 5,
      replies: [],
    },
  ],
};

export function getComments(campaignId: string): CampaignComment[] {
  if (typeof window === "undefined") return SEED_COMMENTS[campaignId] ?? [];
  try {
    const raw = localStorage.getItem(`${COMMENT_KEY_PREFIX}${campaignId}`);
    if (raw) return JSON.parse(raw) as CampaignComment[];
  } catch {}
  return SEED_COMMENTS[campaignId] ?? [];
}

export function saveComments(campaignId: string, comments: CampaignComment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${COMMENT_KEY_PREFIX}${campaignId}`, JSON.stringify(comments));
  window.dispatchEvent(new CustomEvent("dn_comments_updated", { detail: { campaignId } }));
}

/** Subscribe to comment changes for a specific campaign */
export function onCommentsChanged(campaignId: string, cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    if (!detail || detail.campaignId === campaignId) cb();
  };
  window.addEventListener("dn_comments_updated", handler);
  return () => window.removeEventListener("dn_comments_updated", handler);
}

/** Get campaign linked to a specific feedback */
export function getCampaignByFeedbackId(feedbackId: string | number | null | undefined): Campaign | undefined {
  if (!feedbackId) return undefined;
  return readStorage().find((c) => String(c.linkedFeedbackId) === String(feedbackId));
}

/** Subscribe to store changes (same-tab) */
export function onCampaignsChanged(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(STORE_EVENT, cb);
  return () => window.removeEventListener(STORE_EVENT, cb);
}
