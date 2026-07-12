import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CampaignAppealPanel } from "./CampaignAppealPanel";

interface CampaignAppealModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  locale: string;
  isGlobalBan?: boolean;
}

export function CampaignAppealModal({
  isOpen,
  onOpenChange,
  locale,
  isGlobalBan,
}: CampaignAppealModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-6 gap-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black text-slate-800 dark:text-slate-50">
            {locale === "vi" ? "Giải trình khóa tài khoản" : "Appeal Account Lock"}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <CampaignAppealPanel
            locale={locale}
            isGlobalBan={isGlobalBan}
            onSuccess={() => {
              // Optionally close modal on success, or keep open to show the PENDING status.
              // For better UX, we keep it open so they see the status transition to PENDING.
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
