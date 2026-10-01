import { useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AiMark, EmailMock } from "@/components/content/shared";
import { AUGUST_ALV, RESULTS_MONTHS } from "@/lib/contentV2";

type CampaignResult = {
  id: string; name: string; properties: number; click: number; clickDelta: number; ctb: number; ctbDelta: number;
  aiInsight: string; prior: { label: string; click: number; ctb: number } | null; priorBetter: boolean;
};

const CAMPAIGN_RESULTS: Record<string, CampaignResult[]> = {
  "2026-08": [
    { id: "alv", name: "After Last Visit", properties: 4, click: 4.1, clickDelta: 0.7, ctb: 1.9, ctbDelta: 0.4, aiInsight: "The August version outperformed July with guests who stayed 2+ nights — the parade hook in the subject drove the strongest opens of the quarter.", prior: { label: "July 2026", click: 3.4, ctb: 1.5 }, priorBetter: false },
    { id: "welcome", name: "Pre-Arrival Welcome", properties: 4, click: 3.2, clickDelta: -0.3, ctb: 1.1, ctbDelta: -0.2, aiInsight: "Slightly below July — send time may be a factor. Try 10:00 AM instead of 8:00 AM for leisure guests.", prior: { label: "July 2026", click: 3.5, ctb: 1.3 }, priorBetter: true },
  ],
  "2026-09": [
    { id: "alv", name: "After Last Visit", properties: 4, click: 3.8, clickDelta: -0.3, ctb: 1.6, ctbDelta: -0.3, aiInsight: "A small dip after August's strong month. The seasonal hook faded — a fresh reason-to-return angle should lift it again.", prior: { label: "August 2026", click: 4.1, ctb: 1.9 }, priorBetter: true },
    { id: "welcome", name: "Pre-Arrival Welcome", properties: 4, click: 3.4, clickDelta: 0.2, ctb: 1.2, ctbDelta: 0.1, aiInsight: "Steady improvement. Guests respond well to the rooftop-bar mention in the heading.", prior: { label: "August 2026", click: 3.2, ctb: 1.1 }, priorBetter: false },
  ],
  "2026-10": [
    { id: "alv", name: "After Last Visit", properties: 4, click: 3.6, clickDelta: -0.2, ctb: 1.5, ctbDelta: -0.1, aiInsight: "The current version is holding steady, but the August parade version still holds the quarter's best click rate at 4.1%.", prior: { label: "August 2026", click: 4.1, ctb: 1.9 }, priorBetter: true },
    { id: "welcome", name: "Pre-Arrival Welcome", properties: 4, click: 3.5, clickDelta: 0.1, ctb: 1.3, ctbDelta: 0.1, aiInsight: "Consistent. No action needed this period.", prior: null, priorBetter: false },
  ],
};

export function V2Results({ onImprove }: { onImprove: (learning: string) => void }) {
  const [mi, setMi] = useState(RESULTS_MONTHS.length - 1);
  const [tab, setTab] = useState<"overview" | "campaigns">("overview");
  const [reviewOpen, setReviewOpen] = useState(false);

  const m = RESULTS_MONTHS[mi];
  const campaigns = CAMPAIGN_RESULTS[m.id] ?? [];
  const alv = campaigns.find((c) => c.priorBetter);
  const improvementLearning = alv?.prior
    ? `August's After Last Visit version outperformed the current one (4.1% vs ${m.click}% clicks): a concrete seasonal hook in the subject and a direct come-back call to action. Write the new version in that direction, refreshed for the new period.`
    : undefined;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="size-7" aria-label="Previous month" disabled={mi === 0} onClick={() => setMi((x) => x - 1)}><ChevronLeft size={15} /></Button>
          <p className="min-w-[140px] text-center text-[14px] font-semibold text-card-foreground">{m.label}</p>
          <Button variant="ghost" size="icon" className="size-7" aria-label="Next month" disabled={mi >= RESULTS_MONTHS.length - 1} onClick={() => setMi((x) => x + 1)}><ChevronRight size={15} /></Button>
        </div>
        <div className="flex rounded-md bg-muted p-1">
          {(["overview", "campaigns"] as const).map((t) => (
            <Button key={t} size="sm" variant={tab === t ? "secondary" : "ghost"} onClick={() => setTab(t)}>{t === "overview" ? "Overview" : "Campaigns"}</Button>
          ))}
        </div>
      </div>

      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Click rate", value: `${m.click}%`, delta: `${m.clickDelta >= 0 ? "+" : ""}${m.clickDelta}% vs prior` },
              { label: "Click-to-book", value: `${m.ctb}%`, delta: `${m.ctbDelta >= 0 ? "+" : ""}${m.ctbDelta}% vs prior` },
              { label: "Sends", value: m.sends, delta: m.sendsDelta },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-border bg-card p-4 shadow-card">
                <p className="text-[10.5px] font-semibold uppercase text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-[26px] font-semibold text-card-foreground">{s.value}</p>
                <p className={`text-[11.5px] ${s.delta.startsWith("+") ? "text-brand" : "text-warning"}`}>{s.delta}</p>
              </div>
            ))}
          </div>

          <section className="rounded-lg border border-brand/30 bg-brand-soft/30 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <AiMark size={30} />
              <div className="min-w-0">
                <p className="text-[10.5px] font-semibold uppercase text-brand">AI insight</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-card-foreground">{m.aiSummary}</p>
              </div>
            </div>
          </section>

          {alv && improvementLearning && (
            <section className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-soft text-brand"><TrendingUp size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-card-foreground">{alv.prior.label} content did better</p>
                  <p className="mt-0.5 text-[12.5px] text-muted-foreground">{alv.prior.label} clicked {alv.prior.click}% vs {m.click}% this month on {alv.name}. AI can write the next version in that direction — you review before anything is published.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="brand" onClick={() => onImprove(improvementLearning)}><Sparkle size={13} />Improve with AI<ArrowRight size={13} /></Button>
                    <Button size="sm" variant="outline" onClick={() => setReviewOpen(true)}>Review {alv.prior.label} version</Button>
                    <Button size="sm" variant="ghost" onClick={() => setTab("overview")}>Keep current</Button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {campaigns.map((c) => (
            <article key={c.id} className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[15px] font-semibold text-card-foreground">{c.name}</p>
                <span className="text-[11px] text-muted-foreground">{c.properties} properties</span>
              </div>
              <div className="mt-3 flex gap-6">
                <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Click rate</p><p className={`text-[18px] font-semibold ${c.clickDelta >= 0 ? "text-brand" : "text-warning"}`}>{c.click}% <span className="text-[11px] font-normal text-muted-foreground">({c.clickDelta >= 0 ? "+" : ""}{c.clickDelta})</span></p></div>
                <div><p className="text-[10px] font-semibold uppercase text-muted-foreground">Click-to-book</p><p className={`text-[18px] font-semibold ${c.ctbDelta >= 0 ? "text-brand" : "text-warning"}`}>{c.ctb}% <span className="text-[11px] font-normal text-muted-foreground">({c.ctbDelta >= 0 ? "+" : ""}{c.ctbDelta})</span></p></div>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/40 p-3">
                <Sparkle size={13} className="mt-0.5 shrink-0 text-brand" />
                <p className="text-[12px] leading-relaxed text-muted-foreground">{c.aiInsight}</p>
              </div>
              {c.priorBetter && c.prior && (
                <div className="mt-3 border-t border-border pt-3">
                  <Button size="sm" variant="outline" onClick={() => { setTab("overview"); setReviewOpen(true); }}>Use previous version ({c.prior.label} · {c.prior.click}% clicks) — review first</Button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Review prior version: current vs historical */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-3xl" overlayClassName="bg-foreground/60">
          <DialogHeader><DialogTitle>August version vs current</DialogTitle></DialogHeader>
          <div className="max-h-[62vh] overflow-y-auto pr-1">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-[10.5px] font-semibold uppercase text-muted-foreground">August 2026 · 4.1% clicks</p>
                <EmailMock email={AUGUST_ALV.email} image="rooftop" />
              </div>
              <div>
                <p className="mb-2 text-[10.5px] font-semibold uppercase text-muted-foreground">Current · {m.click}% clicks</p>
                <EmailMock email={{ subject: "It's been a while, {first_name}", preheader: "Your room above Times Square is waiting", heading: "Come back to the city", body: "It's been a while since your last stay. Your room in the heart of Times Square is waiting. Book direct for our best rate and a warm welcome at check-in.", cta: "Plan my return" }} image="lobby" />
              </div>
            </div>
            <div className="mt-4 rounded-md border border-brand/30 bg-brand-soft/30 p-3.5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase text-brand"><Sparkle size={12} />What made August better</p>
              <ul className="mt-1.5 space-y-1 text-[12.5px] text-card-foreground">
                <li>• A concrete, time-bound hook in the subject ("the parade is four blocks away") instead of a generic invitation.</li>
                <li>• A direct come-back CTA ("Book now — best rate") that matched the seasonal moment.</li>
              </ul>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReviewOpen(false)}>Close</Button>
            <Button variant="brand" onClick={() => setReviewOpen(false)}>Use this direction in the next update</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
