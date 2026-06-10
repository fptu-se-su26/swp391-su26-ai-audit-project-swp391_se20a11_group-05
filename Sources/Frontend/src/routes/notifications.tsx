import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Bell, CheckCheck, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { getToken } from "@/lib/api";
import { useMarkNotificationReadMutation, useNotifications } from "@/lib/hooks";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/notifications")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (!getToken() || !localStorage.getItem("dn_auth_user_v2")) {
      throw redirect({ to: "/login", search: { redirect: "/notifications", error: undefined } });
    }
  },
  component: NotificationsPage,
});

function NotificationsPage() {
  const { locale } = useI18n();
  const { data = [], isLoading, isFetching, refetch, isError, error } = useNotifications();
  const markRead = useMarkNotificationReadMutation();

  const handleRead = async (id: number) => {
    try {
      await markRead.mutateAsync(id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-2">
            {locale === "vi" ? "Thong bao" : "Notifications"}
          </h1>
          <p className="text-ink-soft">
            {locale === "vi"
              ? "Theo doi cap nhat moi ve phan anh va tai khoan cua ban."
              : "Track updates for your reports and account."}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-civic btn-civic-ghost"
        >
          {isFetching ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          {locale === "vi" ? "Lam moi" : "Refresh"}
        </button>
      </div>

      {isLoading && (
        <div className="min-h-[40vh] grid place-items-center">
          <Loader2 className="animate-spin text-gov-blue" size={40} />
        </div>
      )}

      {isError && (
        <div className="card-civic p-6 mb-6 border-red-100">
          <p className="text-[var(--status-danger)]">
            {error instanceof Error ? error.message : "Could not load notifications"}
          </p>
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <div className="card-civic p-10 text-center">
          <Bell className="mx-auto text-gov-blue mb-4" size={48} />
          <h2 className="text-2xl font-heading text-gov-blue mb-2">
            {locale === "vi" ? "Chua co thong bao" : "No notifications"}
          </h2>
          <p className="text-ink-soft">
            {locale === "vi"
              ? "Khi phan anh co cap nhat, thong bao se hien thi tai day."
              : "Report updates will appear here."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {data.map((item) => (
          <div
            key={item.id}
            className={`card-civic p-5 border-l-4 ${
              item.read ? "border-l-slate-200" : "border-l-gov-gold bg-gov-gold/5"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="font-bold text-lg text-ink">{item.title}</h2>
                  {!item.read && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gov-gold text-gov-blue-deep">
                      {locale === "vi" ? "Moi" : "New"}
                    </span>
                  )}
                </div>
                <p className="text-ink-soft mb-2">{item.content}</p>
                <div className="flex flex-wrap gap-3 text-xs text-ink-soft">
                  <span>{item.type || "SYSTEM"}</span>
                  <span>{item.createdAt?.slice(0, 16).replace("T", " ")}</span>
                  {item.referenceId && (
                    <Link to="/my-reports/$id" params={{ id: String(item.referenceId) }} className="text-gov-blue font-semibold hover:underline">
                      {locale === "vi" ? "Xem phan anh" : "View report"}
                    </Link>
                  )}
                </div>
              </div>

              {!item.read && (
                <button
                  onClick={() => handleRead(item.id)}
                  disabled={markRead.isPending}
                  className="btn-civic btn-civic-ghost shrink-0"
                >
                  <CheckCheck size={18} />
                  {locale === "vi" ? "Da doc" : "Mark read"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
