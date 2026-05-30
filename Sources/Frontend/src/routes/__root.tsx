import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { I18nProvider, FontScaleProvider } from "@/lib/i18n";
import { AuthProvider } from "@/lib/auth";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import bgCivic from "@/assets/bg-civic.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-heading text-gov-blue">404</h1>
        <h2 className="mt-4 text-xl font-bold">Không tìm thấy trang / Page not found</h2>
        <p className="mt-2 text-base text-ink-soft">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="mt-6">
          <Link to="/" className="btn-civic btn-civic-primary">
            Về trang chủ / Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-heading text-gov-blue">Đã có lỗi xảy ra</h1>
        <p className="mt-2 text-base text-ink-soft">{error.message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="btn-civic btn-civic-primary"
          >
            Thử lại
          </button>
          <a href="/" className="btn-civic btn-civic-ghost">Về trang chủ</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Đà Nẵng Kết Nối — Cổng phản ánh chính quyền thành phố" },
      {
        name: "description",
        content:
          "Da Nang Listens — civic reporting platform connecting citizens with municipal authorities for infrastructure, environment, and safety issues.",
      },
      { name: "author", content: "UBND Thành phố Đà Nẵng" },
      { property: "og:title", content: "Đà Nẵng Kết Nối — Cổng phản ánh chính quyền thành phố" },
      { property: "og:description", content: "City Watch connects citizens to authorities for real-time urban issue reporting via a user-friendly platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Đà Nẵng Kết Nối — Cổng phản ánh chính quyền thành phố" },
      { name: "description", content: "City Watch connects citizens to authorities for real-time urban issue reporting via a user-friendly platform." },
      { name: "twitter:description", content: "City Watch connects citizens to authorities for real-time urban issue reporting via a user-friendly platform." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/162c94dc-834f-43a8-bfc1-706a25cf41f4/id-preview-212192de--7df13921-d23d-44dd-96f0-6d5387b73bd7.lovable.app-1778900365683.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/162c94dc-834f-43a8-bfc1-706a25cf41f4/id-preview-212192de--7df13921-d23d-44dd-96f0-6d5387b73bd7.lovable.app-1778900365683.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Public+Sans:wght@300;400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <FontScaleProvider>
          <AuthProvider>
            <div
              className="min-h-screen flex flex-col bg-gov-bg relative"
              style={{
                backgroundImage: `linear-gradient(rgba(244,247,250,0.70), rgba(244,247,250,0.85)), url(${bgCivic})`,
                backgroundSize: "cover",
                backgroundAttachment: "fixed",
                backgroundPosition: "center bottom",
              }}
            >
              <Header />
              <main className="flex-1">
                <Outlet />
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </FontScaleProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
