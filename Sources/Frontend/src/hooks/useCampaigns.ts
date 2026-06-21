import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  campaignApi,
  getToken,
  type CampaignChatMessageResponse,
  type CampaignCreateRequest,
  type CampaignParticipantResponse,
  type CampaignResponse,
  type PageResponse,
} from "@/lib/api";
import {
  createCampaign as createLocalCampaign,
  getCampaignById,
  getCampaigns,
  onCampaignsChanged,
  type Campaign,
  type CampaignCategory,
} from "@/lib/campaignStore";
import { useFeedbackDetail } from "./index";

function mapStatus(status: CampaignResponse["status"]): Campaign["status"] {
  const statusMap: Record<CampaignResponse["status"], Campaign["status"]> = {
    PENDING_APPROVAL: "pending_review",
    RECRUITING: "recruiting",
    IN_PROGRESS: "inProgress",
    COMPLETED: "completed",
    CANCELLED: "completed",
  };
  return statusMap[status] ?? "pending_review";
}

function mapCategory(category?: string | null): CampaignCategory {
  const normalized = category?.toLowerCase();
  if (normalized === "infrastructure") return "infrastructure";
  if (normalized === "public_safety") return "public_safety";
  if (normalized === "construction") return "construction";
  if (normalized === "fire_safety") return "fire_safety";
  return "environment";
}

function mapResponseToCampaign(response: CampaignResponse): Campaign {
  const now = Date.now();
  const endMs = response.endTime ? new Date(response.endTime).getTime() : now + 30 * 86_400_000;
  const daysLeft = Math.max(0, Math.round((endMs - now) / 86_400_000));
  const status = mapStatus(response.status);
  const target = response.maxParticipants ?? 30;
  const progress =
    status === "completed"
      ? 100
      : target > 0
        ? Math.min(100, Math.round((response.participantCount / target) * 100))
        : 0;

  return {
    id: String(response.id),
    name: response.title,
    nameEn: response.title,
    category: mapCategory(response.category),
    status,
    ward: response.wardName ?? "Da Nang",
    createdBy: response.createdByName ?? "Ward staff",
    createdByEn: response.createdByName ?? "Ward staff",
    participants: response.participantCount,
    target,
    progress,
    reports: 0,
    daysLeft,
    impactScore: 0,
    affectedCitizens: 0,
    cover:
      response.coverImageUrl ||
      "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
    desc: response.description ?? "",
    descEn: response.description ?? "",
    featured: false,
    locationText: response.locationText ?? undefined,
    privateLocationText: response.privateLocationText ?? undefined,
    requiredTools: response.requiredTools ?? undefined,
    organizerContact: response.organizerContact ?? undefined,
    startTime: response.startTime ?? undefined,
    endTime: response.endTime ?? undefined,
    createdAt: response.createdAt,
    currentUserJoinStatus: response.currentUserJoinStatus ?? undefined,
    privateDetailsVisible: response.privateDetailsVisible,
    canJoin: response.canJoin,
    canManage: response.canManage,
    canComment: response.canComment,
    canFeedback: response.canFeedback,
    linkedFeedbackId: response.linkedFeedbackId ?? undefined,
    boundaryGeojson: response.boundaryGeojson ?? undefined,
    coverImageUrl: response.coverImageUrl ?? undefined,
    latitude: response.latitude ?? null,
    longitude: response.longitude ?? null,
    wardId: response.wardId,
  } as Campaign;
}

export function useCampaignList(): Campaign[] {
  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>(() => getCampaigns());
  const hasToken = Boolean(typeof window !== "undefined" && getToken());

  useEffect(() => {
    const unsub = onCampaignsChanged(() => setLocalCampaigns(getCampaigns()));
    return unsub;
  }, []);

  const { data: backendPage } = useQuery<PageResponse<CampaignResponse>>({
    queryKey: ["campaigns", "list", hasToken],
    queryFn: () => campaignApi.getAll(0, 50),
    staleTime: 30_000,
    retry: false,
  });

  if (backendPage?.content?.length) {
    const backendIds = new Set(backendPage.content.map((campaign) => String(campaign.id)));
    const localOnly = localCampaigns.filter((campaign) => !backendIds.has(campaign.id));
    return [...backendPage.content.map(mapResponseToCampaign), ...localOnly];
  }

  return localCampaigns;
}

export function useCampaignDetail(id: string): Campaign | undefined {
  const [localCampaign, setLocalCampaign] = useState<Campaign | undefined>(() =>
    getCampaignById(id),
  );
  const isNumericId = /^\d+$/.test(id);
  const hasToken = Boolean(typeof window !== "undefined" && getToken());

  useEffect(() => {
    setLocalCampaign(getCampaignById(id));
    const unsub = onCampaignsChanged(() => setLocalCampaign(getCampaignById(id)));
    return unsub;
  }, [id]);

  const { data: publicCampaign } = useQuery<CampaignResponse>({
    queryKey: ["campaigns", id, "public", hasToken],
    queryFn: () => campaignApi.getById(id),
    enabled: isNumericId,
    staleTime: 30_000,
    retry: false,
  });

  const { data: privateCampaign } = useQuery<CampaignResponse>({
    queryKey: ["campaigns", id, "private", hasToken],
    queryFn: () => campaignApi.getPrivateDetail(id),
    enabled: isNumericId && hasToken,
    staleTime: 30_000,
    retry: false,
  });

  if (isNumericId && (privateCampaign || publicCampaign)) {
    return mapResponseToCampaign(privateCampaign ?? publicCampaign!);
  }

  return localCampaign;
}

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
    async (params: {
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
      latitude?: number;
      longitude?: number;
    }): Promise<Campaign> => {
      setIsLoading(true);

      const fallbackLocation =
        params.privateLocationText || params.locationText || "Sẽ cập nhật sau";
      const fallbackTools = params.requiredTools || "Găng tay, bao rác, dụng cụ vệ sinh cơ bản";
      const fallbackContact = params.organizerContact || "UBND phường phụ trách";

      try {
        if (hasToken) {
          const created = await backendMutation.mutateAsync({
            title: params.title,
            description: params.description,
            category: params.category,
            locationText: params.locationText,
            privateLocationText: fallbackLocation,
            requiredTools: fallbackTools,
            organizerContact: fallbackContact,
            maxParticipants: params.maxParticipants
              ? Number.parseInt(params.maxParticipants, 10)
              : undefined,
            startTime: params.startTime || undefined,
            endTime: params.endTime || undefined,
            linkedFeedbackId: params.linkedFeedbackId ? Number(params.linkedFeedbackId) : undefined,
            latitude: params.latitude,
            longitude: params.longitude,
          });
          return mapResponseToCampaign(created);
        }

        return createLocalCampaign({
          ...params,
          privateLocationText: fallbackLocation,
          requiredTools: fallbackTools,
          organizerContact: fallbackContact,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [backendMutation, hasToken],
  );

  return { submit, isLoading };
}

export function useJoinCampaign() {
  const queryClient = useQueryClient();
  return useMutation<CampaignResponse, Error, string | number>({
    mutationFn: (id) => campaignApi.join(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useApproveCampaign() {
  const queryClient = useQueryClient();
  return useMutation<CampaignResponse, Error, string | number>({
    mutationFn: (id) => campaignApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string | number>({
    mutationFn: (id) => campaignApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useCampaignParticipants(campaignId: string, enabled = true) {
  return useQuery<CampaignParticipantResponse[]>({
    queryKey: ["campaigns", campaignId, "participants"],
    queryFn: () => campaignApi.getParticipants(campaignId),
    enabled:
      enabled && /^\d+$/.test(campaignId) && Boolean(typeof window !== "undefined" && getToken()),
    retry: false,
  });
}

export function useApproveCampaignParticipant(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation<CampaignParticipantResponse, Error, number | string>({
    mutationFn: (participantId) => campaignApi.approveParticipant(campaignId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useRejectCampaignParticipant(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    CampaignParticipantResponse,
    Error,
    { participantId: number | string; reason?: string }
  >({
    mutationFn: ({ participantId, reason }) =>
      campaignApi.rejectParticipant(campaignId, participantId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useCampaignComments(campaignId: string) {
  const queryClient = useQueryClient();
  const enabled = /^\d+$/.test(campaignId) && Boolean(typeof window !== "undefined" && getToken());
  const query = useQuery({
    queryKey: ["campaigns", campaignId, "comments"],
    queryFn: () => campaignApi.getComments(campaignId),
    enabled,
    retry: false,
  });

  const addComment = useMutation({
    mutationFn: (content: string) => campaignApi.addComment(campaignId, content),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId, "comments"] }),
  });

  return { ...query, addComment };
}

export function useCampaignChat(campaignId: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const token = typeof window !== "undefined" ? getToken() : null;
  const enabled = /^\d+$/.test(campaignId) && Boolean(token);

  const query = useQuery<CampaignChatMessageResponse[]>({
    queryKey: ["campaigns", campaignId, "chat"],
    queryFn: () => campaignApi.getChatMessages(campaignId),
    enabled,
    retry: false,
  });

  useEffect(() => {
    if (!enabled || !token || typeof window === "undefined") return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws-native`);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(`CONNECT\nAuthorization:Bearer ${token}\naccept-version:1.2\n\n\0`);
      socket.send(
        `SUBSCRIBE\nid:campaign-${campaignId}\ndestination:/topic/campaigns/${campaignId}/chat\n\n\0`,
      );
    };

    socket.onmessage = (event) => {
      const payload = String(event.data);
      const bodyStart = payload.indexOf("\n\n");
      if (!payload.startsWith("MESSAGE") || bodyStart === -1) return;

      try {
        const body = payload.slice(bodyStart + 2).replace(/\0$/, "");
        const message = JSON.parse(body) as CampaignChatMessageResponse;
        queryClient.setQueryData<CampaignChatMessageResponse[]>(
          ["campaigns", campaignId, "chat"],
          (current = []) => [...current, message],
        );
      } catch {
        queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId, "chat"] });
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [campaignId, enabled, queryClient, token]);

  const sendMessage = useMutation({
    mutationFn: (content: string) => {
      const socket = socketRef.current;
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          `SEND\ndestination:/app/campaigns/${campaignId}/chat\ncontent-type:application/json\n\n${JSON.stringify({ content })}\0`,
        );
        return Promise.resolve(undefined);
      }
      return campaignApi.addChatMessage(campaignId, content).then(() => undefined);
    },
  });

  return useMemo(() => ({ ...query, sendMessage }), [query, sendMessage]);
}

const DEFAULT_PLACEHOLDERS: Record<string, string> = {
  environment:
    "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&auto=format&fit=crop&q=80",
  infrastructure:
    "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&auto=format&fit=crop&q=80",
  public_safety:
    "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=600&auto=format&fit=crop&q=80",
  construction:
    "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&auto=format&fit=crop&q=80",
  fire_safety:
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80",
  default:
    "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80",
};

export function useCampaignThumbnail(campaign?: Campaign): string {
  const feedbackId = campaign?.linkedFeedbackId;
  const { data: feedback } = useFeedbackDetail(feedbackId ? String(feedbackId) : "");

  return useMemo(() => {
    if (!campaign) return DEFAULT_PLACEHOLDERS.default;

    if (campaign.coverImageUrl && campaign.coverImageUrl.trim() !== "") {
      return campaign.coverImageUrl;
    }
    if (campaign.cover && !campaign.cover.includes("photo-1542601906990-b4d3fb778b09")) {
      return campaign.cover;
    }

    if (feedback) {
      if (feedback.attachments && feedback.attachments.length > 0) {
        const img = feedback.attachments.find((att) => att.fileType?.startsWith("image/"));
        if (img) return img.fileUrl;
      }
      if (feedback.mediaUrls && feedback.mediaUrls.length > 0) {
        return feedback.mediaUrls[0];
      }
    }

    const cat = campaign.category || "environment";
    return DEFAULT_PLACEHOLDERS[cat] || DEFAULT_PLACEHOLDERS.default;
  }, [campaign, feedback]);
}
