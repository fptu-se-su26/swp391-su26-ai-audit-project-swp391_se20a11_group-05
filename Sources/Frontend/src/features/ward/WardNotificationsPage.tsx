import React, { useEffect, useRef, useState, useMemo } from "react";
import { Bell, RefreshCw, Loader2, CheckCircle2 } from "lucide-react";
import {
  useInfiniteNotifications,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/hooks";
import { highlightNotificationContent, translateNotificationTitle } from "@/lib/notificationHelper";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { type NotificationResponse } from "@/lib/api";

const PAGE_SIZE = 5;

export function WardNotificationsPage() {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [openingId, setOpeningId] = useState<number | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
    isError,
    error,
  } = useInfiniteNotifications(PAGE_SIZE);

  const markRead = useMarkNotificationReadMutation();
  const markAllRead = useMarkAllNotificationsReadMutation();

  const notifications = useMemo(
    () => data?.pages.flatMap((page) => page.content ?? []) ?? [],
    [data],
  );

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success(
        locale === "vi"
          ? "Đã đánh dấu tất cả thông báo là đã đọc"
          : "All notifications marked as read",
      );
    } catch {
      toast.error(locale === "vi" ? "Thao tác thất bại" : "Action failed");
    }
  };

  const handleNotificationClick = async (item: NotificationResponse) => {
    const feedbackId = item.feedbackId ?? item.referenceId;
    try {
      setOpeningId(item.id);
      if (!item.isRead) {
        await markRead.mutateAsync(item.id);
      }

      if (feedbackId) {
        if (item.type?.startsWith("CAMPAIGN")) {
          await navigate({
            to: "/ward",
            search: { tab: "campaign", detailId: String(feedbackId) },
          });
        } else {
          await navigate({
            to: "/ward",
            search: { tab: "feedback", detailId: String(feedbackId) },
          });
        }
      } else {
        toast.info(
          locale === "vi"
            ? "Thông báo này không kèm theo phản ánh hoặc chiến dịch chi tiết."
            : "This notification is not linked to any report or campaign details.",
        );
      }
    } catch (err) {
      toast.error(
        locale === "vi"
          ? "Không thể cập nhật trạng thái thông báo"
          : "Could not update notification status",
      );
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Bell className="h-5.5 w-5.5 text-indigo-600" />
            {locale === "vi" ? "Thông báo hệ thống" : "System Notifications"}
          </h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {locale === "vi"
              ? "Theo dõi, cập nhật trạng thái các phản ánh hiện trường và hoạt động chiến dịch trên địa bàn."
              : "Monitor and update statuses of field reports and campaigns in the area."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {notifications.some((n) => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-750 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100/50 rounded-lg transition-all cursor-pointer shadow-sm"
            >
              <CheckCircle2 size={13} />
              {locale === "vi" ? "Đọc tất cả" : "Mark all read"}
            </button>
          )}
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-350 bg-white rounded-lg transition-all cursor-pointer shadow-sm animate-fade-in"
          >
            <RefreshCw
              size={13}
              className={isFetching && !isFetchingNextPage ? "animate-spin" : ""}
            />
            {locale === "vi" ? "Làm mới" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Content list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm animate-pulse">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">
            {locale === "vi" ? "Đang tải thông báo..." : "Loading notifications..."}
          </p>
        </div>
      ) : isError ? (
        <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-xl text-center">
          <p className="text-sm font-bold text-rose-700">
            {locale === "vi" ? "Không thể tải thông báo" : "Failed to load notifications"}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {(error as Error)?.message ||
              (locale === "vi" ? "Vui lòng thử lại sau" : "Please try again later")}
          </p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-150/80 dark:border-slate-800/80 shadow-sm">
          <Bell className="h-12 w-12 text-slate-300 mb-4" />
          <p className="text-sm font-bold text-slate-700">
            {locale === "vi" ? "Chưa có thông báo nào" : "No notifications"}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {locale === "vi"
              ? "Thông báo về hoạt động địa bàn của bạn sẽ xuất hiện tại đây."
              : "Notifications about your ward activities will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => {
            const isUnread = !item.isRead;
            const isOpening = openingId === item.id;
            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`group relative rounded-xl border p-4.5 shadow-sm transition-all duration-200 cursor-pointer flex gap-4 items-start ${
                  isUnread
                    ? "bg-indigo-50 border-indigo-200/60 hover:bg-indigo-100/50"
                    : "bg-white border-slate-150/80 hover:border-slate-200 hover:shadow-sm"
                }`}
              >
                {/* Dot unread */}
                {isUnread && (
                  <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-indigo-600" />
                )}

                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isUnread ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  {isOpening ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={`text-sm font-bold ${isUnread ? "text-slate-900" : "text-slate-700"}`}
                    >
                      {translateNotificationTitle(item.title, item.type, locale)}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {highlightNotificationContent(item.content, item.type, locale)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Load More Element */}
          <div ref={loadMoreRef} className="py-6 flex justify-center">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                <Loader2 size={14} className="animate-spin text-indigo-600" />
                <span>{locale === "vi" ? "Đang tải thêm..." : "Loading more..."}</span>
              </div>
            ) : hasNextPage ? (
              <span className="text-xs font-bold text-slate-400">
                {locale === "vi" ? "Cuộn xuống để tải thêm" : "Scroll down to load more"}
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-400">
                {locale === "vi" ? "Đã hiển thị tất cả thông báo" : "All notifications are shown"}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
