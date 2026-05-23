import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { feedbackApi, ApiError } from "@/lib/api";
import { Camera, Video, MapPin, Mic, Check, ArrowLeft, ArrowRight, Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Gửi phản ánh — Đà Nẵng Kết Nối" },
      { name: "description", content: "Gửi phản ánh sự cố đô thị qua 3 bước: ảnh/video, vị trí, mô tả bằng giọng nói." },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const { t, locale } = useI18n();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingCode, setTrackingCode] = useState("");

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("infra");
  const [useGps, setUseGps] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

  const detectLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
          setUseGps(true);
        },
        () => {
          // Fallback: trung tâm Đà Nẵng
          setLatitude(16.0544);
          setLongitude(108.2022);
          setUseGps(true);
        },
      );
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await feedbackApi.create({
        title: title || (locale === "vi" ? "Phản ánh mới" : "New report"),
        description: description || (locale === "vi" ? "Phản ánh từ người dân" : "Citizen report"),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        addressDetails: useGps ? `${latitude}, ${longitude}` : undefined,
        citizenId: 1, // TODO: lấy từ auth context
      });
      setTrackingCode(result.trackingCode || "FB-XXXXXXXX");
      setSubmitted(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        // Fallback demo mode
        setTrackingCode("FB-DEMO-" + Math.random().toString(36).slice(2, 10).toUpperCase());
        setSubmitted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 md:px-8 py-16 text-center">
        <div className="w-24 h-24 rounded-full bg-[var(--status-success)] grid place-items-center mx-auto mb-6 text-white">
          <Check size={56} strokeWidth={3} />
        </div>
        <h1 className="text-3xl md:text-4xl font-heading text-gov-blue mb-4">{t("report.submitted")}</h1>
        <p className="text-lg text-ink-soft mb-2">
          {locale === "vi" ? "Mã phản ánh / Report ID:" : "Report tracking code:"}
        </p>
        <p className="text-2xl font-mono font-bold mb-8">{trackingCode}</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link to="/my-reports" className="btn-civic btn-civic-primary">
            {locale === "vi" ? "Xem báo cáo của tôi" : "View my reports"}
          </Link>
          <Link to="/" className="btn-civic btn-civic-ghost">
            {locale === "vi" ? "Về trang chủ" : "Back to home"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-14">
      <h1 className="font-heading text-4xl md:text-5xl text-gov-blue mb-4">{t("report.title")}</h1>

      {/* Stepper */}
      <ol className="flex items-stretch mb-10 gap-2">
        {[1, 2, 3].map((n) => (
          <li key={n} className="flex-1">
            <div className={`p-4 rounded-lg border-2 ${step >= n ? "border-gov-blue bg-white" : "border-slate-200 bg-slate-50"}`}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full grid place-items-center font-bold ${step > n ? "bg-[var(--status-success)] text-white" : step === n ? "bg-gov-blue text-white" : "bg-slate-200 text-ink-soft"}`}>
                  {step > n ? <Check size={20} /> : n}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs uppercase font-bold text-ink-soft tracking-wider">{t("report.step")} {n}</div>
                  <div className="font-semibold text-ink text-sm">
                    {n === 1 ? t("report.step1") : n === 2 ? t("report.step2") : t("report.step3")}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="card-civic p-6 md:p-10">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-2xl">{t("report.step1")}</h2>
            {/* Title input */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Tiêu đề phản ánh" : "Report title"}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[48px] px-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
                placeholder={locale === "vi" ? "VD: Ổ gà lớn trên đường Hùng Vương" : "E.g. Large pothole on Hung Vuong St"}
              />
            </div>
            {/* Category */}
            <div>
              <label className="block text-sm font-bold mb-2">
                {locale === "vi" ? "Loại phản ánh" : "Category"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "infra", vi: "🏗️ Hạ tầng", en: "🏗️ Infrastructure" },
                  { id: "env", vi: "🌿 Môi trường", en: "🌿 Environment" },
                  { id: "traffic", vi: "🚗 Giao thông", en: "🚗 Traffic" },
                  { id: "safety", vi: "🛡️ An ninh", en: "🛡️ Safety" },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    className={`p-3 rounded-lg border-2 text-left font-semibold transition-all ${
                      category === c.id ? "border-gov-blue bg-gov-blue/5" : "border-slate-200 hover:border-gov-blue/40"
                    }`}
                  >
                    {locale === "vi" ? c.vi : c.en}
                  </button>
                ))}
              </div>
            </div>
            {/* Photo/Video buttons */}
            <div className="grid sm:grid-cols-2 gap-4">
              <button className="border-2 border-dashed border-gov-blue rounded-2xl p-10 hover:bg-gov-blue/5 min-h-[160px] flex flex-col items-center justify-center gap-3 text-gov-blue">
                <Camera size={48} />
                <span className="font-bold text-lg">{t("report.takePhoto")}</span>
              </button>
              <button className="border-2 border-dashed border-[var(--status-pending)] rounded-2xl p-10 hover:bg-[var(--status-pending)]/5 min-h-[160px] flex flex-col items-center justify-center gap-3 text-[var(--status-pending)]">
                <Video size={48} />
                <span className="font-bold text-lg">{t("report.recordVideo")}</span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-2xl">{t("report.step2")}</h2>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6 text-center">
              <MapPin size={48} className="text-gov-blue mx-auto mb-3" />
              {useGps && latitude && longitude ? (
                <div>
                  <p className="text-lg font-semibold text-ink mb-2">
                    {locale === "vi" ? "📍 Đã xác định vị trí:" : "📍 Location detected:"}
                  </p>
                  <p className="text-sm text-ink-soft font-mono mb-4">
                    {latitude.toFixed(6)}, {longitude.toFixed(6)}
                  </p>
                </div>
              ) : (
                <p className="text-lg md:text-xl font-semibold text-ink mb-4">{t("report.locationConfirm")}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={detectLocation} className="btn-civic btn-civic-primary">
                  <Check size={20} />{t("report.useLocation")}
                </button>
                <button className="btn-civic btn-civic-ghost">{t("report.changeLocation")}</button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-2xl">{t("report.step3")}</h2>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-10 text-center">
              <button
                onClick={() => setRecording((r) => !r)}
                className={`w-32 h-32 rounded-full grid place-items-center mx-auto mb-4 text-white transition-all ${recording ? "bg-[var(--status-danger)] animate-pulse" : "bg-gov-blue hover:bg-gov-blue-deep"}`}
                aria-pressed={recording}
              >
                <Mic size={56} />
              </button>
              <p className="text-lg font-semibold">{recording ? t("report.recording") : t("report.tapToSpeak")}</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-6 w-full min-h-[120px] p-4 rounded-lg border-2 border-slate-200 text-base focus:border-gov-blue outline-none"
                placeholder={locale === "vi" ? "Hoặc gõ mô tả tại đây…" : "Or type a description here…"}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8 gap-3">
          <button
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="btn-civic btn-civic-ghost disabled:opacity-40 disabled:pointer-events-none"
          >
            <ArrowLeft size={20} /> {t("report.back")}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep((s) => s + 1)} className="btn-civic btn-civic-primary">
              {t("report.next")} <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="btn-civic btn-civic-primary bg-[var(--status-success)] disabled:opacity-50"
              style={{ background: "var(--status-success)" }}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
              {t("report.submit")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
