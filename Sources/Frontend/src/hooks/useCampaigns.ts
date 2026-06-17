/**
 * useCampaigns — React hooks cho campaign module.
 *
 * Chiến lược:
 *  - Gọi backend API (/api/campaigns) nếu backend trả về dữ liệu
 *  - Nếu backend chưa có dữ liệu / lỗi → fallback về campaignStore (localStorage + seed)
 *  - useCreateCampaign: POST lên backend, đồng thời ghi vào local store để UI phản hồi ngay
 */

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  campaignApi,
  type CampaignResponse,
  type CampaignCreateRequest,
  type PageResponse,
  getToken,
} from "@/lib/api";
import {
  getCampaigns,
  getCampaignById,
  createCampaign as createLocalCampaign,
  onCampaignsChanged,
  type Campaign,
  type CampaignCategory,
} from "@/lib/campaignStore";

// ─── Map backend response → local Campaign shape ─────────────

function mapResponseToCampaign(r: CampaignResponse): Campaign {
  const now = Date.now();
  const endMs = r.endTime ? new Date(r.endTime).getTime() : now + 30 * 86_400_000;
  const daysLeft = Math.max(0, Math.round((endMs - now) / 86_400_000));

  // Map backend status → frontend status key
  const statusMap: Record<string, Campaign["status"]> = {
    PENDING: "pending_review",
    ACTIVE: "inProgress",
    COMPLETED: "completed",
    CANCELLED: "completed",
  };

  return {
    id: String(r.id),
    name: r.title,
    nameEn: r.title,
    category: "environment" as CampaignCategory, // backend doesn't have category yet
    status: statusMap[r.status] ?? "pending_review",
    ward: r.wardName ?? "Đà Nẵng",
    createdBy: r.createdByName ?? "Người dân",
    createdByEn: r.createdByName ?? "Citizen",
    participants: r.participantCount,
    target: r.maxParticipants ?? 30,
    progress: r.status === "COMPLETED" ? 100 : r.status === "ACTIVE" ? 50 : 0,
    reports: 0,
    daysLeft,
    impactScore: 0,
    affectedCitizens: 0,
    cover: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
    desc: r.description ?? "",
    descEn: r.description ?? "",
    featured: false,
    locationText: r.locationText ?? undefined,
    startTime: r.startTime ?? undefined,
    endTime: r.endTime ?? undefined,
    createdAt: r.createdAt,
  };
}

// ─── Hook: danh sách toàn bộ ─────────────────────────────────

export function useCampaignList(): Campaign[] {
  // Local store state (seed + user-created)
  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>(() => getCampaigns());

  useEffect(() => {
    const unsub = onCampaignsChanged(() => setLocalCampaigns(getCampaigns()));
    return unsub;
  }, []);

  // Backend query — chỉ fetch khi có token
  const hasToken = Boolean(typeof window !== "undefined" && getToken());
  const { data: backendPage } = useQuery<PageResponse<CampaignResponse>>({
    queryKey: ["campaigns", "list"],
    queryFn: () => campaignApi.getAll(0, 50),
    enabled: hasToken,
    staleTime: 30_000,
    retry: false,
  });

  if (backendPage && backendPage.content.length > 0) {
    // Merge backend data với local seed:
    // local seed có id string, backend có id number → merge by id
    const backendIds = new Set(backendPage.content.map((c) => String(c.id)));
    const localOnly = localCampaigns.filter((c) => !backendIds.has(c.id));
    const fromBackend = backendPage.content.map(mapResponseToCampaign);
    return [...fromBackend, ...localOnly];
  }

  return localCampaigns;
}

// ─── Hook: một campaign theo id ──────────────────────────────

export function useCampaignDetail(id: string): Campaign | undefined {
  const [localCampaign, setLocalCampaign] = useState<Campaign | undefined>(() =>
    getCampaignById(id),
  );

  useEffect(() => {
    setLocalCampaign(getCampaignById(id));
    const unsub = onCampaignsChanged(() => setLocalCampaign(getCampaignById(id)));
    return unsub;
  }, [id]);

  // Nếu id là số (backend id), thử fetch từ backend
  const isNumericId = /^\d+$/.test(id);
  const { data: backendCampaign } = useQuery<CampaignResponse>({
    queryKey: ["campaigns", id],
    queryFn: () => campaignApi.getById(id),
    enabled: isNumericId,
    staleTime: 30_000,
    retry: false,
  });

  if (isNumericId && backendCampaign) {
    return mapResponseToCampaign(backendCampaign);
  }

  return localCampaign;
}

// ─── Hook: tạo campaign mới ──────────────────────────────────

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const hasToken = Boolean(typeof window !== "undefined" && getToken());

  const backendMutation = useMutation<CampaignResponse, Error, CampaignCreateRequest>({
    mutationFn: (data) => campaignApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  const submit = useCallback(
    (params: {
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
    }): Promise<Campaign> => {
      setIsLoading(true);

      // Luôn ghi vào local store để UI phản hồi ngay lập tức
      const localCampaign = createLocalCampaign(params);

      if (hasToken) {
        // Gửi lên backend đồng thời
        const req: CampaignCreateRequest = {
          title: params.title,
          description: params.description,
          locationText: params.locationText,
          maxParticipants: params.maxParticipants ? parseInt(params.maxParticipants, 10) : undefined,
          startTime: params.startTime ? new Date(params.startTime).toISOString() : undefined,
          endTime: params.endTime ? new Date(params.endTime).toISOString() : undefined,
        };
        backendMutation.mutate(req);
      }

      return new Promise((resolve) => {
        setTimeout(() => {
          setIsLoading(false);
          resolve(localCampaign);
        }, 800);
      });
    },
    [hasToken, backendMutation],
  );

  return { submit, isLoading };
}

// ─── Hook: tham gia / rời chiến dịch ─────────────────────────

export function useJoinCampaign() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string | number>({
    mutationFn: (id) => campaignApi.join(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
