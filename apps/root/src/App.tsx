import { Fullscreen } from "lucide-react";
import { Calendar } from "@/components/Calendar.tsx";
import { ArticlesList } from "@/components/ArticlesList.tsx";
import { SourcesPanel } from "@/components/SourcesPanel.tsx";
import { PinnedArticles } from "@/components/PinnedArticles.tsx";
import { SummaryPanel } from "@/components/SummaryPanel.tsx";
import { Footer } from "@/components/Footer.tsx";
import { Button } from "@/components/ui/button.tsx";
import { useHeaderHeight } from "@/hooks/useHeaderHeight.ts";
import { useContainerLeftOffset } from "@/hooks/useContainerLeftOffset.ts";
import { useCalendarToggle } from "@/hooks/useCalendarToggle.ts";
import { useArticles } from "@/hooks/useArticles.ts";
import { VideosCard } from "./components/VideosCard.tsx";
import { useInfiniteArticles } from "./hooks/useInfiniteArticles.ts";

export function App() {
  const { desktopRef, mobileRef, height: headerHeight } = useHeaderHeight();
  const { ref: containerRef, left: buttonLeft } = useContainerLeftOffset();
  const { visible: calendarVisible, toggle } = useCalendarToggle();
  const { articles, loading, loadingMore, hasMore, loadMore } =
    useInfiniteArticles("http://localhost:8081/v1/articles");

  const { data: dateYT, loading: dateYTLoading } = useArticles(
    "http://localhost:8081/v1/videos",
  );

  console.log(dateYT);

  return (
    <main className="min-h-screen bg-background font-serif relative">
      {/* CALENDRIER FIXE - Mobile */}
      <div
        ref={mobileRef}
        className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border"
      >
        <div className="py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground px-4 mb-2">
            Calendrier
          </p>
          <Calendar scrollable />
        </div>
      </div>

      {/* CALENDRIER FIXE - Desktop */}
      <div
        ref={desktopRef}
        style={{ viewTransitionName: "calendar-header" }}
        className={`hidden lg:block fixed top-0 left-0 right-0 z-50 bg-background backdrop-blur-md border-b border-border ${calendarVisible ? "" : "h-0 pointer-events-none overflow-hidden"}`}
      >
        <div className="mx-auto max-w-5xl px-12 py-6">
          <section className="px-5 py-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-4">
              Calendrier
            </p>
            <Calendar />
          </section>
        </div>
      </div>

      {/* ================================================================== */}
      {/* ================================================================== */}
      {/* ================================================================== */}

      {/* CONTENU PRINCIPAL */}
      <div
        style={{
          viewTransitionName: "main-content",
          "--header-height": `${calendarVisible ? headerHeight : 0}px`,
        }}
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12 pt-[var(--header-height)] pb-10 transition-[padding-top] transition-height duration-150 ease-out"
      >
        {/* ================================================================== */}
        {/* ================================================================== */}
        {/* ================================================================== */}
        {/* Grille Desktop */}
        <div
          ref={containerRef}
          className="hidden lg:grid grid-cols-3 border-l border-border"
        >
          {/* Colonne gauche sticky */}
          <div className="border-r border-border">
            <div className="sticky overflow-y-auto scrollbar-hide top-[var(--header-height)] h-[calc(100vh_-_var(--header-height))] pt-2">
              {/* Sources actives */}
              <SourcesPanel />
              <PinnedArticles />
            </div>
          </div>

          {/* Colonne droite Desktop List */}
          <section id="list">
            <div className="border-r border-border py-0">
              <ArticlesList
                articles={articles}
                loading={loading}
                loadingMore={loadingMore}
                hasMore={hasMore}
                loadMore={loadMore}
              />
              ;
              <VideosCard data={dateYT} loading={dateYTLoading} />
            </div>
          </section>

          {/* Colonne droite Summary */}
          <SummaryPanel />
        </div>
        {/* ================================================================== */}
        {/* ================================================================== */}
        {/* ================================================================== */}

        {/* Header Mobile */}
        <div className="lg:hidden mb-8 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">
            Collection
          </p>
          <h1 className="text-3xl sm:text-4xl font-normal leading-none tracking-tight text-foreground">
            Veille Tech
          </h1>
        </div>

        {/* Articles Mobile */}
        <div className="lg:hidden space-y-0">
          <ArticlesList
            articles={articles}
            loading={loading}
            loadingMore={loadingMore}
            hasMore={hasMore}
            loadMore={loadMore}
          />
          <VideosCard data={dateYT} loading={dateYTLoading} />
        </div>

        {/* ================================================================== */}
        {/* ================================================================== */}
        {/* ================================================================== */}
        {/* Pied de page */}
        <Footer />
        <Button
          style={{ left: `${buttonLeft}px` }}
          className={`fixed top-[calc(var(--header-height)_+_0.5rem)]`}
          variant="ghost"
          onClick={toggle}
        >
          <Fullscreen />
        </Button>
        {/* ================================================================== */}
        {/* ================================================================== */}
        {/* ================================================================== */}
      </div>
    </main>
  );
}
