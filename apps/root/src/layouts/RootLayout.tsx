import { useMediaQuery } from "@/hooks/useMediaQuery";
import { MobileLayout } from "./MobileLayout";
import { DesktopLayout } from "./DesktopLayout";
import { BannerProvider } from "@/components/BannerContext";

export function RootLayout() {
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <BannerProvider>
      {isMobile ? <MobileLayout /> : <DesktopLayout />}
    </BannerProvider>
  );
}
