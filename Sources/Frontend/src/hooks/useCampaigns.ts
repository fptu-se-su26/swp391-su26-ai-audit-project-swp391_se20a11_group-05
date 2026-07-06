import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient, useInfiniteQuery, type InfiniteData } from "@tanstack/react-query";
import {
  campaignApi,
  userApi,
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
  onCampaignsChanged,
  type Campaign,
  type CampaignCategory,
} from "@/lib/campaignStore";
import { useFeedbackDetail, usePublicFeedbackDetail } from "./index";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

function mapStatus(status: CampaignResponse["status"]): Campaign["status"] {
  const statusMap: Record<CampaignResponse["status"], Campaign["status"]> = {
    RECRUITING: "recruiting",
    IN_PROGRESS: "inProgress",
    COMPLETED: "ended",
    CANCELLED: "cancelled",
    ACTIVE: "inProgress",
    ENDED: "ended",
  };
  return statusMap[status] ?? "recruiting";
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
    status === "completed" || status === "ended"
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
    canLeave: response.canLeave,
    canManage: response.canManage,
    canComment: response.canComment,
    canFeedback: response.canFeedback,
    announcementMode: response.announcementMode,
    linkedFeedbackId: response.linkedFeedbackId ?? undefined,
    boundaryGeojson: response.boundaryGeojson ?? undefined,
    coverImageUrl: response.coverImageUrl ?? undefined,
    imageUrls: response.imageUrls ?? undefined,
    latitude: response.latitude ?? null,
    longitude: response.longitude ?? null,
    wardId: response.wardId,
  } as Campaign;
}

export function useCampaignList(): Campaign[] {
  const { data: backendPage } = useQuery<PageResponse<CampaignResponse>>({
    queryKey: ["campaigns", "list"],
    queryFn: () => campaignApi.getAll(0, 50),
    staleTime: 30_000,
    retry: false,
  });

  // Only return backend campaigns — no mock/seed data merge
  if (backendPage?.content) {
    return backendPage.content.map(mapResponseToCampaign);
  }

  // Return empty while backend query is loading
  return [];
}

export function useCampaignDetail(id: string): Campaign | undefined {
  const [localCampaign, setLocalCampaign] = useState<Campaign | undefined>(undefined);
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
    staleTime: 5000,
    refetchInterval: 5000,
    retry: false,
  });

  const { data: privateCampaign, isError: privateError } = useQuery<CampaignResponse>({
    queryKey: ["campaigns", id, "private", hasToken],
    queryFn: () => campaignApi.getPrivateDetail(id),
    enabled: isNumericId && hasToken,
    staleTime: 5000,
    refetchInterval: 5000,
    retry: false,
  });

  if (isNumericId && ((privateCampaign && !privateError) || publicCampaign)) {
    return mapResponseToCampaign(
      privateCampaign && !privateError ? privateCampaign : publicCampaign!,
    );
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
      wardId?: number | null;
      latitude?: number;
      longitude?: number;
      boundaryGeojson?: string;
      coverImageUrl?: string;
      imageUrls?: string[];
    }): Promise<Campaign> => {
      setIsLoading(true);

      const fallbackLocation =
        params.privateLocationText || params.locationText || "Sẽ cập nhật sau";
      const fallbackTools = params.requiredTools || "";
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
            wardId: params.wardId ?? undefined,
            latitude: params.latitude,
            longitude: params.longitude,
            boundaryGeojson: params.boundaryGeojson,
            coverImageUrl: params.coverImageUrl,
            imageUrls: params.imageUrls,
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
  return useMutation<
    CampaignResponse,
    Error,
    {
      id: string | number;
      volunteerExperience?: string;
      availabilityHours?: string;
      otpCode: string;
    }
  >({
    mutationFn: ({ id, ...data }) => campaignApi.join(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useLeaveCampaign() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: string | number; reason: string }>({
    mutationFn: ({ id, reason }) => campaignApi.leave(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      // Remove stale private detail query data from React Query cache
      queryClient.removeQueries({ queryKey: ["campaigns", String(variables.id), "private"] });
      queryClient.removeQueries({ queryKey: ["campaigns", Number(variables.id), "private"] });
    },
  });
}

export function useConfirmWaitlist() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string | number>({
    mutationFn: (id) => campaignApi.confirmWaitlist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useBatchApproveParticipants(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation<CampaignParticipantResponse[], Error, (number | string)[]>({
    mutationFn: (participantIds) =>
      campaignApi.batchApproveParticipants(campaignId, participantIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useMarkNoShow(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation<CampaignParticipantResponse, Error, number | string>({
    mutationFn: (participantId) => campaignApi.markNoShow(campaignId, participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useSendEmailOtp() {
  return useMutation<string, Error, void>({
    mutationFn: () => campaignApi.sendEmailOtp(),
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string | number>({
    mutationFn: (id) => campaignApi.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["campaigns"] });
      const previousCampaignQueries = queryClient.getQueriesData<PageResponse<CampaignResponse>>({
        queryKey: ["campaigns"],
      });

      previousCampaignQueries.forEach(([queryKey, previousPage]) => {
        if (!previousPage?.content) return;

        const nextContent = previousPage.content.filter(
          (campaign) => String(campaign.id) !== String(id),
        );
        if (nextContent.length === previousPage.content.length) return;

        queryClient.setQueryData<PageResponse<CampaignResponse>>(queryKey, {
          ...previousPage,
          content: nextContent,
          totalElements: Math.max(0, previousPage.totalElements - 1),
          empty: nextContent.length === 0,
        });
      });

      return { previousCampaignQueries };
    },
    onError: (_error, _id, context: any) => {
      context?.previousCampaignQueries?.forEach(([queryKey, previousPage]: [any, any]) => {
        queryClient.setQueryData(queryKey, previousPage);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation<CampaignResponse, Error, { id: string | number; data: CampaignCreateRequest }>(
    {
      mutationFn: ({ id, data }) => campaignApi.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      },
    },
  );
}

export function useEndCampaign() {
  const queryClient = useQueryClient();
  return useMutation<CampaignResponse, Error, string | number>({
    mutationFn: (id) => campaignApi.end(id),
    onSuccess: (data) => {
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
    refetchInterval: 5000,
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

// Helper functions to manage infinite query chat cache
function appendMessageToInfiniteData(
  old: InfiniteData<CampaignChatMessageResponse[]> | undefined,
  message: CampaignChatMessageResponse
): InfiniteData<CampaignChatMessageResponse[]> {
  if (!old) return { pages: [[message]], pageParams: [undefined] };
  const newPages = [...old.pages];
  if (newPages.length === 0) {
    newPages.push([message]);
  } else {
    newPages[0] = [...newPages[0], message];
  }
  return { ...old, pages: newPages };
}

function updateMessageInInfiniteData(
  old: InfiniteData<CampaignChatMessageResponse[]> | undefined,
  message: CampaignChatMessageResponse
): InfiniteData<CampaignChatMessageResponse[]> {
  if (!old) return { pages: [], pageParams: [] };
  const newPages = old.pages.map((page) =>
    page.map((m) => (m.id === message.id ? message : m))
  );
  return { ...old, pages: newPages };
}

function deleteMessageFromInfiniteData(
  old: InfiniteData<CampaignChatMessageResponse[]> | undefined,
  messageId: number | string
): InfiniteData<CampaignChatMessageResponse[]> {
  if (!old) return { pages: [], pageParams: [] };
  const newPages = old.pages.map((page) =>
    page.filter((m) => String(m.id) !== String(messageId))
  );
  return { ...old, pages: newPages };
}

function existsInInfiniteData(
  old: InfiniteData<CampaignChatMessageResponse[]> | undefined,
  messageId: number | string
): boolean {
  if (!old) return false;
  return old.pages.some((page) => page.some((m) => String(m.id) === String(messageId)));
}

export function useCampaignChat(campaignId: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectDelayRef = useRef<number>(1000);
  const [isWsConnected, setIsWsConnected] = useState(false);
  const { user } = useAuth();

  const token = typeof window !== "undefined" ? getToken() : null;
  const enabled = /^\d+$/.test(campaignId) && Boolean(token);

  const query = useInfiniteQuery<CampaignChatMessageResponse[], Error, InfiniteData<CampaignChatMessageResponse[]>, (string | number)[], number | undefined>({
    queryKey: ["campaigns", campaignId, "chat"],
    queryFn: ({ pageParam }) => campaignApi.getChatMessages(campaignId, pageParam),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      const nonPinned = lastPage.filter((m) => !m.pinned);
      const cursorSource = nonPinned.length > 0 ? nonPinned : lastPage;
      const minId = Math.min(...cursorSource.map((m) => Number(m.id)));
      return minId;
    },
    enabled,
    retry: false,
    refetchInterval: isWsConnected ? 60000 : 5000,
  });

  useEffect(() => {
    if (!enabled || !token || typeof window === "undefined") return;

    let isDestroyed = false;

    const connect = () => {
      if (isDestroyed) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${window.location.host}/ws-native`);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isDestroyed) {
          socket.close();
          return;
        }
        setIsWsConnected(true);
        reconnectDelayRef.current = 1000;

        socket.send(`CONNECT\nAuthorization:Bearer ${token}\naccept-version:1.2\n\n\0`);
        socket.send(
          `SUBSCRIBE\nid:campaign-${campaignId}\ndestination:/topic/campaigns/${campaignId}/chat\n\n\0`,
        );
        socket.send(
          `SUBSCRIBE\nid:campaign-${campaignId}-announcement\ndestination:/topic/campaigns/${campaignId}/announcement-mode\n\n\0`,
        );

        // Sync missing messages
        queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId, "chat"] });
      };

      socket.onmessage = (event) => {
        if (isDestroyed) return;
        const payload = String(event.data);
        let bodyStart = payload.indexOf("\r\n\r\n");
        let headerLength = 4;
        if (bodyStart === -1) {
          bodyStart = payload.indexOf("\n\n");
          headerLength = 2;
        }
        if (!payload.startsWith("MESSAGE") || bodyStart === -1) return;

        if (payload.includes(`/topic/campaigns/${campaignId}/announcement-mode`)) {
          try {
            const body = payload.slice(bodyStart + headerLength).replace(/\0$/, "");
            const data = JSON.parse(body) as { announcementMode: boolean };
            queryClient.setQueryData<CampaignResponse>(
              ["campaigns", String(campaignId), "private", true],
              (old) => old ? { ...old, announcementMode: data.announcementMode } : old
            );
            queryClient.setQueryData<CampaignResponse>(
              ["campaigns", String(campaignId), "private", false],
              (old) => old ? { ...old, announcementMode: data.announcementMode } : old
            );
            queryClient.invalidateQueries({ queryKey: ["campaigns", String(campaignId)] });
          } catch (e) {
            console.error("Failed to parse announcement-mode WS message", e);
          }
          return;
        }

        try {
          const body = payload.slice(bodyStart + headerLength).replace(/\0$/, "");
          const message = JSON.parse(body) as CampaignChatMessageResponse;

          queryClient.setQueryData<InfiniteData<CampaignChatMessageResponse[]>>(
            ["campaigns", campaignId, "chat"],
            (old) => {
              if (!message.message || message.message.trim() === "") {
                return deleteMessageFromInfiniteData(old, message.id);
              }

              const exists = existsInInfiniteData(old, message.id);
              if (exists) {
                return updateMessageInInfiniteData(old, message);
              }

              if (old) {
                const newPages = old.pages.map((page) => {
                  const optimisticIndex = page.findIndex(
                    (m) =>
                      m.id < 0 &&
                      m.message === message.message &&
                      JSON.stringify(m.imageUrls || []) === JSON.stringify(message.imageUrls || []) &&
                      (m.senderName === message.senderName || m.senderName === "Tôi" || message.senderName === user?.name)
                  );
                  if (optimisticIndex !== -1) {
                    const next = [...page];
                    next[optimisticIndex] = message;
                    return next;
                  }
                  return page;
                });

                const replaced = newPages.some((page, i) => page !== old.pages[i]);
                if (replaced) {
                  return { ...old, pages: newPages };
                }
              }

              return appendMessageToInfiniteData(old, message);
            },
          );
        } catch {
          queryClient.invalidateQueries({ queryKey: ["campaigns", campaignId, "chat"] });
        }
      };

      const handleDisconnect = () => {
        setIsWsConnected(false);
        socketRef.current = null;

        if (!isDestroyed) {
          const delay = reconnectDelayRef.current;
          reconnectDelayRef.current = Math.min(delay * 2, 30000);
          
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = window.setTimeout(() => {
            connect();
          }, delay);
        }
      };

      socket.onclose = handleDisconnect;
      socket.onerror = handleDisconnect;
    };

    connect();

    return () => {
      isDestroyed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      const socket = socketRef.current;
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.onmessage = null;
        if (socket.readyState === WebSocket.CONNECTING) {
          socket.onopen = () => {
            socket.close();
          };
        } else {
          socket.close();
        }
        socketRef.current = null;
      }
      setIsWsConnected(false);
    };
  }, [campaignId, enabled, queryClient, token, user?.name]);

  const sendMessage = useMutation({
    mutationFn: ({ content, imageUrls }: { content: string; imageUrls?: string[]; resendId?: number }) => {
      return campaignApi.addChatMessage(campaignId, content, imageUrls);
    },
    onMutate: async ({ content, imageUrls, resendId }: { content: string; imageUrls?: string[]; resendId?: number }) => {
      await queryClient.cancelQueries({ queryKey: ["campaigns", campaignId, "chat"] });
      const previousMessages = queryClient.getQueryData<InfiniteData<CampaignChatMessageResponse[]>>([
        "campaigns",
        campaignId,
        "chat",
      ]);

      const optimisticMessage: CampaignChatMessageResponse = {
        id: -Date.now(),
        senderId: 0,
        senderName: user?.name || "Tôi",
        senderRole: user?.role || "CITIZEN",
        message: content.trim(),
        imageUrls: imageUrls || [],
        pinned: false,
        createdAt: new Date().toISOString(),
        status: "sending" as const,
      };

      queryClient.setQueryData<InfiniteData<CampaignChatMessageResponse[]>>(
        ["campaigns", campaignId, "chat"],
        (old) => {
          let updated = old;
          if (resendId) {
            updated = deleteMessageFromInfiniteData(old, resendId);
          }
          return appendMessageToInfiniteData(updated, optimisticMessage);
        },
      );

      return { previousMessages, tempId: optimisticMessage.id };
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData<InfiniteData<CampaignChatMessageResponse[]>>(
        ["campaigns", campaignId, "chat"],
        (old) => {
          if (!old) return old;
          const newPages = old.pages.map((page) =>
            page.map((m) => {
              if (m.id === context?.tempId) {
                return { ...m, status: "failed" as const };
              }
              return m;
            })
          );
          return { ...old, pages: newPages };
        }
      );
    },
    onSuccess: (savedMessage) => {
      queryClient.setQueryData<InfiniteData<CampaignChatMessageResponse[]>>(
        ["campaigns", campaignId, "chat"],
        (old) => {
          if (existsInInfiniteData(old, savedMessage.id)) {
            if (!old) return old;
            const newPages = old.pages.map((page) =>
              page.filter(
                (m) =>
                  !(
                    m.id < 0 &&
                    m.message === savedMessage.message &&
                    JSON.stringify(m.imageUrls || []) === JSON.stringify(savedMessage.imageUrls || [])
                  )
              )
            );
            return { ...old, pages: newPages };
          }

          if (!old) return { pages: [[savedMessage]], pageParams: [undefined] };

          const newPages = old.pages.map((page) => {
            const optimisticIndex = page.findIndex(
              (m) =>
                m.id < 0 &&
                m.message === savedMessage.message &&
                JSON.stringify(m.imageUrls || []) === JSON.stringify(savedMessage.imageUrls || []) &&
                (m.senderName === savedMessage.senderName || m.senderName === "Tôi" || savedMessage.senderName === user?.name)
            );
            if (optimisticIndex !== -1) {
              const next = [...page];
              next[optimisticIndex] = savedMessage;
              return next;
            }
            return page;
          });

          const replaced = newPages.some((page, i) => page !== old.pages[i]);
          if (replaced) {
            return { ...old, pages: newPages };
          }

          return appendMessageToInfiniteData(old, savedMessage);
        }
      );
    },
  });

  return useMemo(() => ({ ...query, sendMessage, isWsConnected }), [query, sendMessage, isWsConnected]);
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

  // Nếu campaign đã có cover/thumbnail riêng thì không cần fetch feedback
  const hasLocalThumbnail = !!(
    campaign && (
      (campaign.imageUrls && campaign.imageUrls.length > 0 && campaign.imageUrls[0]?.trim() !== "") ||
      (campaign.coverImageUrl && campaign.coverImageUrl.trim() !== "") ||
      (campaign.cover && !campaign.cover.includes("photo-1542601906990-b4d3fb778b09"))
    )
  );

  // Sử dụng endpoint public để tránh lỗi 403 Forbidden phân quyền quản lý và chỉ chạy khi thực sự cần thiết
  const { data: feedback } = usePublicFeedbackDetail(
    !hasLocalThumbnail && feedbackId ? String(feedbackId) : "",
    { enabled: !hasLocalThumbnail && !!feedbackId }
  );

  return useMemo(() => {
    if (!campaign) return DEFAULT_PLACEHOLDERS.default;

    if (
      campaign.imageUrls &&
      campaign.imageUrls.length > 0 &&
      campaign.imageUrls[0]?.trim() !== ""
    ) {
      return campaign.imageUrls[0];
    }
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

export function usePinChatMessage(campaignId: string) {
  const queryClient = useQueryClient();
  const chatKey = ["campaigns", campaignId, "chat"];

  return useMutation<CampaignChatMessageResponse, Error, number | string>({
    mutationFn: (messageId) => campaignApi.pinMessage(campaignId, messageId),

    // Optimistic update: cập nhật UI ngay lập tức, không chờ server
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: chatKey });
      const snapshot = queryClient.getQueryData<InfiniteData<CampaignChatMessageResponse[]>>(chatKey);

      queryClient.setQueryData<InfiniteData<CampaignChatMessageResponse[]>>(chatKey, (old) => {
        if (!old) return old;
        const newPages = old.pages.map((page) =>
          page.map((m) => (String(m.id) === String(messageId) ? { ...m, pinned: true } : m))
        );
        return { ...old, pages: newPages };
      });

      return { snapshot };
    },

    // Nếu server từ chối (vd: đã đạt 3 ghim), rollback về snapshot cũ
    onError: (err: any, _messageId, context: any) => {
      if (context?.snapshot) {
        queryClient.setQueryData(chatKey, context.snapshot);
      }
      toast.error(err?.message || "Không thể ghim tin nhắn.");
    },

    // Sau khi server xác nhận, đồng bộ lại dữ liệu chính xác
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKey });
    },
  });
}

export function useUnpinChatMessage(campaignId: string) {
  const queryClient = useQueryClient();
  const chatKey = ["campaigns", campaignId, "chat"];

  return useMutation<CampaignChatMessageResponse, Error, number | string>({
    mutationFn: (messageId) => campaignApi.unpinMessage(campaignId, messageId),

    // Optimistic update: bỏ ghim ngay lập tức
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: chatKey });
      const snapshot = queryClient.getQueryData<InfiniteData<CampaignChatMessageResponse[]>>(chatKey);

      queryClient.setQueryData<InfiniteData<CampaignChatMessageResponse[]>>(chatKey, (old) => {
        if (!old) return old;
        const newPages = old.pages.map((page) =>
          page.map((m) => (String(m.id) === String(messageId) ? { ...m, pinned: false } : m))
        );
        return { ...old, pages: newPages };
      });

      return { snapshot };
    },

    // Rollback nếu lỗi
    onError: (err: any, _messageId, context: any) => {
      if (context?.snapshot) {
        queryClient.setQueryData(chatKey, context.snapshot);
      }
      toast.error(err?.message || "Không thể bỏ ghim tin nhắn.");
    },

    // Đồng bộ sau khi server xác nhận
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKey });
    },
  });
}

export function useSignalAttendance(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation<CampaignParticipantResponse, Error, "CONFIRMED" | "MAYBE">({
    mutationFn: (signal) => campaignApi.signalAttendance(campaignId, signal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useFinalizeCampaign() {
  const queryClient = useQueryClient();
  return useMutation<CampaignResponse, Error, string | number>({
    mutationFn: (id) => campaignApi.finalizeCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useDeleteChatMessageMutation(campaignId: string | number) {
  const queryClient = useQueryClient();
  const chatKey = ["campaigns", String(campaignId), "chat"];

  return useMutation<void, Error, number | string>({
    mutationFn: (messageId) => campaignApi.deleteChatMessage(campaignId, messageId),
    onMutate: async (messageId) => {
      await queryClient.cancelQueries({ queryKey: chatKey });
      const snapshot = queryClient.getQueryData<InfiniteData<CampaignChatMessageResponse[]>>(chatKey);

      queryClient.setQueryData<InfiniteData<CampaignChatMessageResponse[]>>(chatKey, (old) =>
        deleteMessageFromInfiniteData(old, messageId)
      );

      return { snapshot };
    },
    onError: (err, _messageId, context: any) => {
      if (context?.snapshot) {
        queryClient.setQueryData(chatKey, context.snapshot);
      }
      toast.error("Không thể xóa tin nhắn.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatKey });
    },
  });
}

export function useSetAnnouncementMode(campaignId: string | number) {
  const queryClient = useQueryClient();
  return useMutation<CampaignResponse, Error, boolean>({
    mutationFn: (enabled) => campaignApi.setAnnouncementMode(campaignId, enabled),
    onSuccess: (updatedCampaign) => {
      queryClient.setQueryData<CampaignResponse>(
        ["campaigns", String(campaignId), "private", true],
        updatedCampaign
      );
      queryClient.setQueryData<CampaignResponse>(
        ["campaigns", String(campaignId), "private", false],
        updatedCampaign
      );
      queryClient.invalidateQueries({ queryKey: ["campaigns", String(campaignId)] });
    },
    onError: () => {
      toast.error("Không thể thay đổi chế độ chỉ Cán bộ được nhắn.");
    },
  });
}

export function useWarnUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { userId: number; reason: string }>({
    mutationFn: ({ userId, reason }) => userApi.warn(userId, reason),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
}

export function useBlacklistQuery() {
  return useQuery({
    queryKey: ["users", "blacklist"],
    queryFn: () => userApi.getBlacklist(),
  });
}

export function useUnbanUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, number>({
    mutationFn: (userId) => userApi.unban(userId),
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users", "blacklist"] });
    },
  });
}

export function useBanUserMutation() {
  const queryClient = useQueryClient();
  return useMutation<any, Error, { userId: number; reason: string }>({
    mutationFn: ({ userId, reason }) => userApi.ban(userId, reason),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
      queryClient.invalidateQueries({ queryKey: ["users", "blacklist"] });
    },
  });
}

export function useLookupParticipantByPhone(campaignId: string | number) {
  return useMutation({
    mutationFn: (phone: string) => campaignApi.lookupParticipantByPhone(campaignId, phone),
  });
}

export function useBulkSaveAttendance(campaignId: string | number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { attendances: { participantId: number; attended: boolean }[] }) =>
      campaignApi.bulkSaveAttendance(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", String(campaignId), "participants"] });
    },
  });
}


