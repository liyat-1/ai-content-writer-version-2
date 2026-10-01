import { useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Info, Sparkle, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmailMock, fill } from "@/components/content/shared";
import { RefreshFlow, type FlowSetup } from "./RefreshFlow";
import { V2Results } from "./V2Results";
import {
  DEMO_TODAY, HOTEL, TOTAL_PROPERTIES, USAGE_ROWS, dismissPusher, publishPeriod, useHistoricalVersion, useV2,
  type Period, type PeriodCopy,
} from "@/lib/contentV2";

type View = "content" | "results";

/* ------- AI copy generation: refreshes the current voice for the selected months ------- */

const MONTH_COPY: Record<number, { subject: string; heading: string; body: string }> = {
  9: { subject: "{first_name}, October in Midtown is yours", heading: "Crisp evenings. Bright lights. Your city.", body: "October is one of the best months to be in New York — crisp walks past Central Park, Broadway at its best and the rooftop lit up over the city. Your room in the heart of Times Square is waiting. Book direct for our best rate and a warm welcome at check-in." },
  10: { subject: "{first_name}, Thanksgiving in Midtown?", heading: "Come back for the parade", body: "The Thanksgiving Parade passes four blocks from our door, and November in Midtown is full of moments worth coming back for. Your room above Times Square is waiting. Book now for our best rate and a warm welcome at check-in." },
  11: { subject: "{first_name}, December belongs in Midtown", heading: "A festive December awaits", body: "Fifth Avenue's holiday windows, the Rockefeller tree and Midtown at its most magical — all steps from your room above Times Square. Book now for our best rate and a warm welcome at check-in." },
  0: { subject: "{first_name}, a new year in New York", heading: "Start the year in the city", body: "January in Midtown is calm, bright and full of possibilities. Your room above Times Square is waiting whenever you're ready. Book direct for our best rate and a warm welcome at check-in." },
};

function generateCopy(month: number, tone: string, direction: string, seasonal: string | null, note: string): PeriodCopy {
  const base = MONTH_COPY[month] ?? MONTH_COPY[9];
  const seasonalOn = seasonal !== null && (direction !== "general" || true); // suggestion already accepted explicitly
  let body = base.body;
  if (tone === "concise") body = body.split("—")[0].trim() + ". Book now for our best rate.";
  if (tone === "warmer") body = "We'd love to welcome you back. " + body;
  if (direction === "promotional") body = body.replace("Book direct for our best rate", "Our best rate of the season is live — book direct");
  if (note) body = `${note.replace(/\.$/, "")}. ` + body;
  return {
    email: {
      subject: seasonalOn && month === 10 ? base.subject : MONTH_COPY[month]?.subject ?? base.subject,
      preheader: seasonalOn ? "A seasonal reason to come back — plus your best direct rate." : "Your best direct rate, always.",
      heading: base.heading,
      body: seasonalOn || direction !== "general" ? body : "It's been a while since your last stay. Your room in the heart of Times Square is waiting. Book direct for our best rate and a warm welcome at check-in.",
      cta: tone === "concise" || direction === "promotional" ? "Book now — best rate" : "Plan my return",
    },
    text: seasonalOn
      ? `Hi {first_name}! ${seasonal} is 4 blocks from us. Your room above Times Square is waiting — best rate direct: {booking_link}`
      : `Hi {first_name}, your room above Times Square is waiting. Best rate direct: {booking_link}`,
  };
}

/* ------- small pieces ------- */

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return <div className="min-w-0"><p className="text-[10.5px] font-semibold uppercase text-muted-foreground">{label}</p><p className={`mt-0.5 text-[15px] font-semibold ${accent ? "text-brand" : "text-card-foreground"}`}>{value}</p></div>;
}

function VersionCard({ period, onViewContent, onViewProperties, onUse }: { period: Period; onViewContent: () => void; onViewProperties: () => void; onUse: (p: Period) => void }) {
  const active = period.status === "Current";
  return (
    <article className={`rounded-lg border bg-card p-4 shadow-card ${active ? "border-brand/40" : "border-border"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[15px] font-semibold text-card-foreground">{period.label}</p>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            {period.aiAssisted && <Sparkle size={12} className="text-brand" />}{period.originLabel}
            {period.publishedAt && <> · Updated {period.publishedAt}</>}
          </p>
        </div>
        <span className={`rounded-sm px-2 py-0.5 text-[10.5px] font-semibold ${active ? "bg-brand text-brand-foreground" : period.status === "Upcoming" ? "bg-muted text-muted-foreground" : "bg-brand-soft text-brand"}`}>{active ? "Current" : period.status}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-3">
        <Stat label="Properties using" value={active || period.status === "Published" ? `${period.properties} / ${TOTAL_PROPERTIES}` : period.previouslyUsedBy ? `${period.previouslyUsedBy} previously` : "—"} />
        {period.performance && <Stat label="Click rate" value={`${period.performance.click}%`} accent={period.performance.clickDelta > 0} />}
        {period.performance && <Stat label="Click-to-book" value={`${period.performance.ctb}%`} accent={period.performance.ctbDelta > 0} />}
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onViewContent}>View content</Button>
          <Button size="sm" variant="ghost" onClick={onViewProperties}><Users size={13} />Properties</Button>
          {!active && !period.aiAssisted && <Button size="sm" variant="brand" onClick={() => onUse(period)}>Use this version</Button>}
        </div>
      </div>
    </article>
  );
}

/* ------- main workspace ------- */

export function V2Workspace() {
  const v2 = useV2();
  const [view, setView] = useState<View>("content");
  const [flow, setFlow] = useState<FlowSetup | null>(null);
  const [introDismissed, setIntroDismissed] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [monthIdx, setMonthIdx] = useState(2); // October
  const [contentOpen, setContentOpen] = useState<Period | null>(null);
  const [propsOpen, setPropsOpen] = useState<Period | null>(null);
  const [confirmUse, setConfirmUse] = useState<Period | null>(null);

  const periods = v2.periods;
  const current = periods.find((p) => p.status === "Current");
  const nextUp = periods.find((p) => p.status === "Upcoming");
  const shownPeriods = periods.filter((p) => p.status !== "Upcoming" || v2.nextReady === p.id);
  const selectedPeriod = shownPeriods[Math.min(monthIdx, shownPeriods.length - 1)];

  const periodOptions = periods.filter((p) => p.status === "Upcoming" || p.status === "Current").map((p) => ({
    id: p.id, label: p.label, short: p.short, month: Number(p.id.slice(5)) - 1,
    dateRange: `${p.short} 1–30, 2026`, blurb: p.status === "Current" ? `${p.short} is active now — the next content your guests will see.` : `The next period without fresh content.`,
  }));
  const recommended = nextUp ?? periods[2];

  const pusherState = !v2.pusherDismissed && nextUp ? (v2.nextReady === nextUp.id ? "ready" : "suggest") : "off";

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="text-[10.5px] font-semibold uppercase text-brand">Content / Library V2</p>
          <h1 className="mt-2 font-display text-[30px] font-semibold text-card-foreground sm:text-[36px]">Content Library</h1>
          <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">One simple loop: refresh with AI, review, publish, and see how it performs. You always decide.</p>
        </div>
        <div className="flex rounded-md bg-muted p-1">
          {(["content", "results"] as const).map((v) => (
            <Button key={v} size="sm" variant={view === v ? "secondary" : "ghost"} onClick={() => setView(v)}>{v === "content" ? "Content" : "Results"}</Button>
          ))}
        </div>
      </header>

      {view === "results" ? (
        <V2Results onImprove={(learning) => setFlow({ recommendedId: recommended.id, context: learning })} />
      ) : (
        <div className="space-y-6 pt-6">
          {/* Initial AI refresh intro — dismissible */}
          {!introDismissed && (
            <section className="ai-edge relative overflow-hidden rounded-lg p-6 sm:p-8">
              <div aria-hidden className="ai-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(80%_80%_at_20%_0%,black,transparent)]" />
              <div className="relative flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand"><Sparkle size={11} />New</p>
                  <h2 className="mt-3 font-display text-[24px] font-semibold leading-tight text-card-foreground sm:text-[28px]">Refresh your content with AI</h2>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Directful AI can refresh your automated invite content for the period ahead — based on your current content, your tone, and the moments that matter. Nothing publishes until you review it.</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-muted-foreground">
                    <span>Last updated: 30 days ago</span>
                    <span>Next suggested update: {nextUp?.short}</span>
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button variant="brand" onClick={() => setFlow({ recommendedId: recommended.id })}><Sparkle size={14} />Update with AI</Button>
                    <Button variant="outline" onClick={() => setIntroOpen(true)}>Learn how it works</Button>
                    <Button variant="ghost" onClick={() => setIntroDismissed(true)}>Keep current content</Button>
                  </div>
                </div>
                <Button variant="ghost" size="icon" aria-label="Dismiss" onClick={() => setIntroDismissed(true)}><X size={16} /></Button>
              </div>
            </section>
          )}

          {/* Contextual pusher */}
          {nextUp && pusherState !== "off" && (
            <section aria-live="polite" className={`rounded-lg border p-4 sm:p-5 ${pusherState === "ready" ? "border-brand/40 bg-brand-soft/40" : "border-warning/40 bg-warning-soft/40"}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`grid size-9 shrink-0 place-items-center rounded-md ${pusherState === "ready" ? "bg-brand text-brand-foreground" : "bg-warning text-background"}`}><CalendarDays size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-card-foreground">{pusherState === "ready" ? `${nextUp.short} content is ready` : `Prepare your ${nextUp.short} content`}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {pusherState === "ready"
                      ? "Your AI-assisted update is ready to publish whenever you are."
                      : `${current?.label} is active now. ${nextUp.short} starts soon — AI can prepare it from your current content in a couple of minutes.`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="brand" onClick={() => setFlow({ recommendedId: nextUp.id })}><Sparkle size={13} />Update with AI</Button>
                  <Button size="sm" variant="ghost" onClick={() => dismissPusher()}>Not now</Button>
                </div>
              </div>
            </section>
          )}
          {v2.pusherDismissed && nextUp && pusherState === "off" && (
            <button onClick={() => setFlow({ recommendedId: nextUp.id })} className="flex w-full items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-left text-[12px] text-muted-foreground transition-colors hover:border-brand/40">
              <Info size={13} className="shrink-0 text-brand" />Reminder: {v2.nextReady === nextUp.id ? `${nextUp.short} content is ready to publish` : `Prepare ${nextUp.short} content when you're ready`}
            </button>
          )}

          {/* Current content timer */}
          {current && (
            <section className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <div>
                  <p className="text-[10.5px] font-semibold uppercase text-muted-foreground">Current content</p>
                  <p className="mt-0.5 text-[17px] font-semibold text-card-foreground">{current.label}</p>
                </div>
                <span className="rounded-sm bg-brand-soft px-2 py-0.5 text-[10.5px] font-semibold text-brand">Active</span>
                <Stat label="Running" value={`${DEMO_TODAY.day} days`} />
                <Stat label="Properties using" value={`${current.properties} / ${TOTAL_PROPERTIES}`} />
                <Stat label="Next period" value={nextUp?.label ?? "—"} />
                {current.performance && <Stat label="Click rate" value={`${current.performance.click}%`} accent />}
                <div className="ml-auto"><Button size="sm" variant="brand" onClick={() => setFlow({ recommendedId: recommended.id })}><Sparkle size={13} />Update with AI</Button></div>
              </div>
            </section>
          )}

          {/* Published content, month-based navigation */}
          <section aria-label="Published content">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-[16px] font-semibold text-card-foreground">Published content</h2>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="size-7" aria-label="Previous month" disabled={monthIdx === 0} onClick={() => setMonthIdx((m) => Math.max(0, m - 1))}><ChevronLeft size={15} /></Button>
                <p className="min-w-[150px] text-center text-[14px] font-semibold text-card-foreground">{selectedPeriod?.label}</p>
                <Button variant="ghost" size="icon" className="size-7" aria-label="Next month" disabled={monthIdx >= shownPeriods.length - 1} onClick={() => setMonthIdx((m) => Math.min(shownPeriods.length - 1, m + 1))}><ChevronRight size={15} /></Button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {selectedPeriod && <VersionCard period={selectedPeriod} onViewContent={() => setContentOpen(selectedPeriod)} onViewProperties={() => setPropsOpen(selectedPeriod)} onUse={setConfirmUse} />}
              {v2.publishedCount > 0 && <p className="text-center text-[11.5px] text-muted-foreground">{v2.publishedCount} AI-assisted {v2.publishedCount === 1 ? "update" : "updates"} published so far — all previous versions are kept in history.</p>}
            </div>
          </section>
        </div>
      )}

      {/* Update with AI flow */}
      {flow && (
        <RefreshFlow
          setup={flow}
          periodOptions={periodOptions}
          baseCopy={current?.copy ?? periods[2].copy}
          aiCopy={({ month, tone, direction, seasonal, note }) => [generateCopy(month, tone, direction, seasonal?.name ?? null, note)]}
          learning={flow.context}
          onPublish={({ periodId, copy }) => { publishPeriod(periodId, copy, true); setFlow(null); setMonthIdx(shownPeriods.findIndex((p) => p.id === periodId) >= 0 ? shownPeriods.findIndex((p) => p.id === periodId) : monthIdx); }}
          onClose={() => setFlow(null)}
        />
      )}

      {/* View content dialog */}
      <Dialog open={!!contentOpen} onOpenChange={(o) => !o && setContentOpen(null)}>
        <DialogContent className="max-w-lg" overlayClassName="bg-foreground/60">
          <DialogHeader><DialogTitle>{contentOpen?.label} content</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-brand"><Sparkle size={12} />{contentOpen?.originLabel}</p>
            <EmailMock email={contentOpen?.copy.email ?? { subject: "", preheader: "", heading: "", body: "", cta: "" }} image="lobby" />
            <div className="rounded-md bg-muted/40 p-3"><p className="text-[10.5px] font-semibold uppercase text-muted-foreground">Text message</p><p className="mt-1 text-[12.5px] text-card-foreground">{fill(contentOpen?.copy.text ?? "")}</p></div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Properties dialog */}
      <Dialog open={!!propsOpen} onOpenChange={(o) => !o && setPropsOpen(null)}>
        <DialogContent className="max-w-md" overlayClassName="bg-foreground/60">
          <DialogHeader><DialogTitle>Properties · {propsOpen?.label}</DialogTitle></DialogHeader>
          <ul className="max-h-[55vh] space-y-1.5 overflow-y-auto pr-1">
            {USAGE_ROWS.map((row) => (
              <li key={row.property} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-[12.5px]">
                <span className="truncate text-card-foreground">{row.property}</span>
                <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${row.using === "suggested" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"}`}>{row.using === "suggested" ? "Suggested content" : "Custom content"}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground">Publishing a new version never changes properties that use their own content.</p>
        </DialogContent>
      </Dialog>

      {/* Use historical version confirmation */}
      <Dialog open={!!confirmUse} onOpenChange={(o) => !o && setConfirmUse(null)}>
        <DialogContent className="max-w-md" overlayClassName="bg-foreground/60">
          <DialogHeader><DialogTitle>Use this version?</DialogTitle></DialogHeader>
          <p className="text-[13px] leading-relaxed text-muted-foreground">This will make the <strong className="text-card-foreground">{confirmUse?.label}</strong> content your current suggested content. It won't be sent to properties using custom content, and your current version is kept in history. Publishing still requires your review before anything goes out.</p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmUse(null)}>Cancel</Button>
            <Button variant="brand" onClick={() => { if (confirmUse) useHistoricalVersion(confirmUse.id); setConfirmUse(null); }}>Use this version</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Learn how it works */}
      <Dialog open={introOpen} onOpenChange={setIntroOpen}>
        <DialogContent className="max-w-md" overlayClassName="bg-foreground/60">
          <DialogHeader><DialogTitle>How AI refresh works</DialogTitle></DialogHeader>
          <ol className="space-y-2.5">
            {["Choose when — AI recommends the period based on when content will actually be used.", "Choose how — keep your tone or try a new one; accept or skip seasonal suggestions.", "Review the plan — you see exactly what AI will do before anything is written.", "Review content — compare with your current version, edit anything, then publish.", "Track results — see how the update performed, and carry forward what worked."].map((s, i) => (
              <li key={s} className="flex items-start gap-2.5 text-[12.5px] text-card-foreground"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-soft text-[10px] font-bold text-brand">{i + 1}</span>{s}</li>
            ))}
          </ol>
          <div className="flex justify-end"><Button variant="brand" onClick={() => { setIntroOpen(false); setFlow({ recommendedId: recommended.id }); }}><Sparkle size={13} />Try it now<ArrowRight size={13} /></Button></div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
