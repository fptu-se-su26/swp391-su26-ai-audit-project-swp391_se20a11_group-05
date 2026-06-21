import { createFileRoute, redirect } from "@tanstack/react-router";
import { CampaignCreateContent } from "@/features/ward/CampaignCreateContent";

export const Route = createFileRoute("/campaigns/create")({
  head: () => ({
    meta: [
      { title: "Tạo chiến dịch cộng đồng - Đà Nẵng Kết Nối" },
      {
        name: "description",
        content: "Biểu mẫu tạo chiến dịch cộng đồng dành cho cán bộ phường.",
      },
    ],
  }),
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem("dn_auth_user_v2");
      if (raw) {
        try {
          const user = JSON.parse(raw);
          if (user && user.role === "WARD_STAFF") {
            throw redirect({
              to: "/ward",
              search: { tab: "campaign/create" },
            });
          }
        } catch (e) {
          // ignore
        }
      }
    }
  },
  component: CreateCampaignPage,
});

function CreateCampaignPage() {
  return (
    <main className="min-h-screen bg-[#F8F7FF] pb-16 text-slate-950">
      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <CampaignCreateContent />
      </div>
    </main>
  );
}
