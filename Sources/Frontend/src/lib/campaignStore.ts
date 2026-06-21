/**
 * Campaign Store - shared in-memory + localStorage state.
 *
 * Trang my-reports và các route campaigns.* dùng store này làm fallback khi
 * backend chưa có dữ liệu, đồng thời giữ phản hồi UI nhanh cho dữ liệu local.
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
  privateLocationText?: string;
  requiredTools?: string;
  organizerContact?: string;
  currentUserJoinStatus?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  privateDetailsVisible?: boolean;
  canJoin?: boolean;
  canManage?: boolean;
  canComment?: boolean;
  canFeedback?: boolean;
  createdAt: string;
  boundaryGeojson?: string | null;
  coverImageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  wardId?: number | null;
}

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

const SEED_CREATED_AT = "2026-06-17T00:00:00.000Z";

const SEED_CAMPAIGNS: Campaign[] = [];

const STORAGE_KEY = "dn_campaigns_v1";
const STORE_EVENT = "dn_campaigns_updated";

function readStorage(): Campaign[] {
  if (typeof window === "undefined") return SEED_CAMPAIGNS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_CAMPAIGNS;
    const parsed = JSON.parse(raw) as Campaign[];
    const seedIds = new Set(SEED_CAMPAIGNS.map((campaign) => campaign.id));
    const userCreated = parsed.filter((campaign) => !seedIds.has(campaign.id));
    return [...SEED_CAMPAIGNS, ...userCreated];
  } catch {
    return SEED_CAMPAIGNS;
  }
}

function writeStorage(campaigns: Campaign[]) {
  if (typeof window === "undefined") return;
  const seedIds = new Set(SEED_CAMPAIGNS.map((campaign) => campaign.id));
  const userCreated = campaigns.filter((campaign) => !seedIds.has(campaign.id));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(userCreated));
  window.dispatchEvent(new Event(STORE_EVENT));
}

export function getCampaigns(): Campaign[] {
  return readStorage();
}

export function getCampaignById(id: string): Campaign | undefined {
  return readStorage().find((campaign) => campaign.id === id);
}

export function createCampaign(params: {
  title: string;
  description: string;
  category: CampaignCategory;
  locationText?: string;
  privateLocationText?: string;
  requiredTools?: string;
  organizerContact?: string;
  maxParticipants?: string;
  startTime?: string;
  endTime?: string;
  linkedFeedbackId?: string | number | null;
  linkedFeedbackCode?: string | null;
  linkedFeedbackTitle?: string | null;
  wardName?: string;
}): Campaign {
  const id = `user-${Date.now()}`;
  const target = Number.parseInt(params.maxParticipants || "30", 10) || 30;

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
    createdBy: "Cán bộ phường",
    createdByEn: "Ward staff",
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
    privateLocationText: params.privateLocationText,
    requiredTools: params.requiredTools,
    organizerContact: params.organizerContact,
    createdAt: new Date().toISOString(),
  };

  writeStorage([...readStorage(), newCampaign]);
  return newCampaign;
}

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

const SEED_COMMENTS: Record<string, CampaignComment[]> = {};

export function getComments(campaignId: string): CampaignComment[] {
  if (typeof window === "undefined") return SEED_COMMENTS[campaignId] ?? [];
  try {
    const raw = localStorage.getItem(`${COMMENT_KEY_PREFIX}${campaignId}`);
    if (raw) return JSON.parse(raw) as CampaignComment[];
  } catch {
    return SEED_COMMENTS[campaignId] ?? [];
  }
  return SEED_COMMENTS[campaignId] ?? [];
}

export function saveComments(campaignId: string, comments: CampaignComment[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${COMMENT_KEY_PREFIX}${campaignId}`, JSON.stringify(comments));
  window.dispatchEvent(new CustomEvent("dn_comments_updated", { detail: { campaignId } }));
}

export function onCommentsChanged(campaignId: string, cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent).detail;
    if (!detail || detail.campaignId === campaignId) cb();
  };
  window.addEventListener("dn_comments_updated", handler);
  return () => window.removeEventListener("dn_comments_updated", handler);
}

export function getCampaignByFeedbackId(
  feedbackId: string | number | null | undefined,
): Campaign | undefined {
  if (!feedbackId) return undefined;
  return readStorage().find((campaign) => String(campaign.linkedFeedbackId) === String(feedbackId));
}

export function onCampaignsChanged(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(STORE_EVENT, cb);
  return () => window.removeEventListener(STORE_EVENT, cb);
}
