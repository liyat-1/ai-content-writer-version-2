import { useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, ImagePlus, MapPin, Pencil, Search, Trash2, Upload, X } from "lucide-react";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TODAY, calendar, fmtRange, useCalendar, type CalendarEvent, type EventType } from "@/lib/calendar";
import { EVENT_ICONS, EVENT_IMAGES } from "./eventImages";
import { CalendarUploadDialog } from "./CalendarUploadDialog";

const TYPE_STYLE: Record<EventType, string> = {
  Holiday: "bg-event-holiday text-event-holiday-foreground",
  "Local event": "bg-event-local text-event-local-foreground",
  Seasonal: "bg-event-seasonal text-event-seasonal-foreground",
};
const TYPE_DOT: Record<EventType, string> = {
  Holiday: "bg-event-holiday-foreground",
  "Local event": "bg-event-local-foreground",
  Seasonal: "bg-event-seasonal-foreground",
};
const ALL_TYPES: EventType[] = ["Holiday", "Local event", "Seasonal"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY = 86_400_000;
const empty = (): CalendarEvent => ({ id: `m-${Date.now()}`, name: "", start: TODAY, end: TODAY, type: "Local event", source: "Added manually" });

/** Monday-start month grid of ISO dates. */
function monthGrid(year: number, month: number): string[] {
  const first = new Date(Date.UTC(year, month, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const total = lead + days;
  const cells = Math.ceil(total / 7) * 7;
  const start = Date.UTC(year, month, 1) - lead * DAY;
  return Array.from({ length: cells }, (_, i) => new Date(start + i * DAY).toISOString().slice(0, 10));
}

export function EventsPage() {
  const { events, hasHotelCalendar } = useCalendar();
  const [q, setQ] = useState("");
  const [month, setMonth] = useState(() => Number(TODAY.slice(5, 7)) - 1);
  const [year, setYear] = useState(() => Number(TODAY.slice(0, 4)));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<CalendarEvent | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [types, setTypes] = useState<Record<EventType, boolean>>({ Holiday: true, "Local event": true, Seasonal: true });
  const photo = useRef<HTMLInputElement>(null);
  const qFiltered = events.filter((e) => `${e.name} ${e.location ?? ""} ${e.source}`.toLowerCase().includes(q.toLowerCase()));
  const filtered = qFiltered.filter((e) => types[e.type]);
  const cells = monthGrid(year, month);
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month, 1)));
  const monthEvents = filtered.filter((e) => e.start <= cells[cells.length - 1] && e.end >= cells[0]);
  const selected = selectedId ? filtered.find((e) => e.id === selectedId) ?? events.find((e) => e.id === selectedId) : monthEvents[0];
  const eventsOn = (date: string) => filtered.filter((e) => e.start <= date && e.end >= date);
  const step = (dir: 1 | -1) => { const next = month + dir; if (next < 0) { setMonth(11); setYear(year - 1); } else if (next > 11) { setMonth(0); setYear(year + 1); } else setMonth(next); };
  const goToday = () => { setMonth(Number(TODAY.slice(5, 7)) - 1); setYear(Number(TODAY.slice(0, 4))); };
  const toggleType = (t: EventType) => setTypes((f) => ({ ...f, [t]: !f[t] }));
  const save = (form: CalendarEvent) => { calendar.upsert({ ...form, end: form.end < form.start ? form.start : form.end }); setSelectedId(form.id); setDraft(null); };

  const panel = draft ? (
    <form className="flex min-h-0 flex-col" onSubmit={(e) => { e.preventDefault(); if (!draft.name.trim()) return; save(draft); }}>
      <div className="flex items-center justify-between border-b border-border pb-3"><p className="text-[12.5px] font-semibold text-card-foreground">{selected ? `Edit · ${selected.name}` : "New event"}</p><Button type="button" variant="ghost" size="icon" className="size-7" aria-label="Close editor" onClick={() => { setDraft(null); setSelectedId(null); }}><X size={14} /></Button></div>
      <div className="mt-3 space-y-2.5">
        <Input aria-label="Name" placeholder="Event name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <div className="grid grid-cols-2 gap-2"><Input aria-label="Start" type="date" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} /><Input aria-label="End" type="date" value={draft.end} min={draft.start} onChange={(e) => setDraft({ ...draft, end: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="Type" className="h-9 rounded-md border border-input bg-background px-2 text-[13px]" value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as EventType })}><option>Holiday</option><option>Local event</option><option>Seasonal</option></select>
          <Input aria-label="Location" placeholder="Location" value={draft.location ?? ""} onChange={(e) => setDraft({ ...draft, location: e.target.value })} />
        </div>
        <div>
          <button type="button" className="flex w-full items-center gap-2 rounded-md border border-dashed border-border px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand" onClick={() => photo.current?.click()}>
            <ImagePlus size={14} />{draft.image ? "Change photo" : "Attach a photo"}
          </button>
          <input ref={photo} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; const reader = new FileReader(); reader.onload = () => setDraft({ ...draft, image: String(reader.result) }); reader.readAsDataURL(f); e.target.value = ""; }} />
          {draft.image && <div className="mt-2 overflow-hidden rounded-md"><img src={draft.image} alt="" className="h-24 w-full object-cover" /><button type="button" className="mt-1 text-[11px] font-semibold text-destructive" onClick={() => setDraft({ ...draft, image: undefined })}>Remove photo</button></div>}
        </div>
      </div>
      <div className="mt-4 flex gap-2 border-t border-border pt-3"><Button type="submit" variant="brand" className="flex-1">Save</Button><Button type="button" variant="ghost" onClick={() => { setDraft(null); setSelectedId(null); }}>Cancel</Button></div>
    </form>
  ) : selected ? (
    <div className="flex min-h-0 flex-col">
      <div className="relative overflow-hidden rounded-md">{(() => { const Icon = EVENT_ICONS[selected.type] ?? CalendarDays; const image = selected.image ?? EVENT_IMAGES[selected.id]; return image ? <img src={image} alt={selected.name} className="h-44 w-full object-cover" /> : <div className={`grid h-44 place-items-center ${TYPE_STYLE[selected.type]}`}><Icon size={30} strokeWidth={1.75} /></div>; })()}</div>
      <p className="mt-4 text-[18px] font-semibold text-card-foreground">{selected.name}</p>
      <p className="mt-1 text-[12px] text-muted-foreground">{fmtRange(selected.start, selected.end)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2"><span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold ${TYPE_STYLE[selected.type]}`}>{selected.type}</span><span className="rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{selected.source}</span></div>
      {selected.location && <p className="mt-3 flex items-center gap-1 text-[12px] text-muted-foreground"><MapPin size={13} />{selected.location}</p>}
      {selected.note && <p className="mt-2 rounded-md bg-muted/55 px-3 py-2 text-[12px] leading-5 text-card-foreground">{selected.note}</p>}
      <div className="mt-4 flex gap-2 border-t border-border pt-3"><Button size="sm" variant="brand" className="flex-1" onClick={() => setDraft(selected)}><Pencil size={13} />Edit</Button><Button size="sm" variant="outline" onClick={() => { calendar.remove(selected.id); setSelectedId(null); }}><Trash2 size={13} />Remove</Button></div>
    </div>
  ) : (
    <div className="flex min-h-0 flex-col items-center justify-center gap-2 py-10 text-center"><CalendarDays size={22} className="text-muted-foreground" /><p className="text-[12.5px] font-semibold text-card-foreground">Select a day or event</p><p className="text-[11.5px] text-muted-foreground">Click any event block to see its details, or add a new one.</p></div>
  );

  return (
    <MarketingShell title="Events & Holidays">
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-6 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div><p className="text-[10.5px] font-semibold uppercase text-brand">Content / Events & Holidays</p><h1 className="mt-2 font-display text-[30px] font-semibold text-card-foreground sm:text-[36px]">Events & Holidays</h1><p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">Local moments that shape your guest content.</p></div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setUploadOpen(true)}><Upload size={14} />Upload calendar</Button>
            <Button variant="brand" onClick={() => { setDraft(empty()); setSelectedId(null); }}><Pencil size={14} />Add event</Button>
          </div>
        </header>
        <div className="mb-5 mt-5 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] max-w-sm flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search events" className="pl-8" /></div>
          <p className="ml-auto text-[12px] text-muted-foreground">{monthEvents.length} {monthEvents.length === 1 ? "moment" : "moments"} in view</p>
        </div>
        {monthEvents.length > 0 && <section className="mb-6" aria-label="This month's moments"><p className="mb-3 text-[10px] font-semibold uppercase text-brand">At a glance · {monthLabel}</p><div className="flex gap-3 overflow-x-auto pb-2">{monthEvents.map((e) => { const Icon = EVENT_ICONS[e.type] ?? CalendarDays; const image = e.image ?? EVENT_IMAGES[e.id]; return <Button key={e.id} variant="outline" onClick={() => { setSelectedId(e.id); setDraft(null); }} className={`h-auto w-[220px] shrink-0 flex-col items-stretch gap-0 overflow-hidden rounded-md p-0 text-left ${selected?.id === e.id ? "border-brand ring-1 ring-brand" : ""}`}><span className="relative block h-24">{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span className={`grid h-full place-items-center ${TYPE_STYLE[e.type]}`}><Icon size={24} /></span>}</span><span className="block min-w-0 px-3 py-2.5"><span className="block truncate text-[12px] font-semibold text-card-foreground">{e.name}</span><span className="mt-0.5 block text-[10.5px] font-normal text-muted-foreground">{fmtRange(e.start, e.end)} · {e.type}</span></span></Button>; })}</div></section>}
        <div className="grid gap-5 lg:grid-cols-[228px_minmax(0,1fr)_300px]">
          <aside className="flex flex-col gap-4" aria-label="Calendar controls">
            <div className="rounded-lg border border-border bg-card p-3 shadow-card">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[12px] font-semibold text-card-foreground">{monthLabel}</p>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="icon" className="size-6" aria-label="Previous month" onClick={() => step(-1)}><ChevronLeft size={13} /></Button>
                  <Button variant="ghost" size="icon" className="size-6" aria-label="Next month" onClick={() => step(1)}><ChevronRight size={13} /></Button>
                </div>
              </div>
              <div className="grid grid-cols-7 text-center text-[9px] font-semibold uppercase text-muted-foreground">{WEEKDAYS.map((d) => <span key={d} className="py-0.5">{d[0]}</span>)}</div>
              <div className="grid grid-cols-7">
                {cells.map((date) => {
                  const inMonth = Number(date.slice(5, 7)) - 1 === month;
                  const isToday = date === TODAY;
                  const dayEvents = filtered.filter((e) => e.start <= date && e.end >= date);
                  return (
                    <button key={date} type="button" onClick={() => { if (dayEvents[0]) { setSelectedId(dayEvents[0].id); setDraft(null); } }} className={`flex h-8 flex-col items-center justify-center rounded-full transition-colors ${isToday ? "bg-brand font-bold text-brand-foreground" : inMonth ? "text-card-foreground hover:bg-accent" : "text-muted-foreground/50 hover:bg-accent"}`} aria-label={date}>
                      <span className={`text-[10.5px] ${isToday ? "" : "font-medium"}`}>{Number(date.slice(8, 10))}</span>
                      <span className="mt-0.5 flex h-1 gap-0.5">{dayEvents.slice(0, 3).map((e) => <i key={e.id} className={`size-1 rounded-full ${isToday ? "bg-brand-foreground" : TYPE_DOT[e.type]}`} />)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-card p-3.5 shadow-card">
              <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Categories</p>
              {ALL_TYPES.map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2 py-1 text-[12px] text-card-foreground">
                  <input type="checkbox" checked={types[t]} onChange={() => toggleType(t)} className="size-3.5 accent-[var(--brand)]" />
                  <span className={`size-2 rounded-full ${TYPE_DOT[t]}`} />{t}
                  <span className="ml-auto text-[11px] text-muted-foreground">{qFiltered.filter((e) => e.type === t).length}</span>
                </label>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-card p-3.5 shadow-card">
              <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Calendars</p>
              <label className="flex cursor-pointer items-center gap-2 py-1 text-[12px] text-card-foreground"><input type="checkbox" checked={hasHotelCalendar} onChange={(e) => calendar.setHotelCalendar(e.target.checked)} className="size-3.5 accent-[var(--brand)]" />Hotel calendar connected</label>
            </div>
          </aside>
          <section className="overflow-hidden rounded-lg border border-border bg-card shadow-card" aria-label="Calendar">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="size-7" aria-label="Previous month" onClick={() => step(-1)}><ChevronLeft size={15} /></Button>
                <p className="min-w-[150px] px-1 text-center text-[15px] font-semibold text-card-foreground">{monthLabel}</p>
                <Button variant="ghost" size="icon" className="size-7" aria-label="Next month" onClick={() => step(1)}><ChevronRight size={15} /></Button>
                <Button variant="outline" size="sm" className="ml-2 h-7 rounded-full px-3 text-[12px]" onClick={goToday}>Today</Button>
              </div>
            </div>
            <div className="grid grid-cols-7 border-b border-border bg-muted/40 text-center text-[10px] font-semibold uppercase text-muted-foreground">{WEEKDAYS.map((d) => <span key={d} className="py-1.5">{d}</span>)}</div>
            <div className="grid grid-cols-7">
              {cells.map((date) => {
                const inMonth = Number(date.slice(5, 7)) - 1 === month;
                const isToday = date === TODAY;
                const dayEvents = eventsOn(date);
                return (
                  <div key={date} className={`min-h-[104px] border-b border-r border-border p-1.5 last:border-r-0 ${inMonth ? "bg-card" : "bg-canvas"}`}>
                    <p className="mb-1 flex justify-end">{isToday ? <span className="grid size-[22px] place-items-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">{Number(date.slice(8, 10))}</span> : <span className={`grid size-[22px] place-items-center text-[11px] font-semibold ${inMonth ? "text-card-foreground" : "text-muted-foreground/60"}`}>{Number(date.slice(8, 10))}</span>}</p>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map((e) => (
                        <Button key={e.id} variant="ghost" size="sm" onClick={() => { setSelectedId(e.id); setDraft(null); }} className={`block h-6 w-full truncate rounded-md px-1.5 py-0.5 text-left text-[10px] font-medium transition-colors hover:opacity-80 ${TYPE_STYLE[e.type]} ${inMonth ? "" : "opacity-45"} ${selected?.id === e.id ? "ring-2 ring-inset ring-brand" : ""}`} title={e.name}>
                          <span className="block truncate">{e.name}</span>
                        </Button>
                      ))}
                      {dayEvents.length > 3 && <p className="text-[9.5px] text-muted-foreground">+{dayEvents.length - 3} more</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
          <aside className="h-fit rounded-lg border border-border bg-card p-4 shadow-card lg:sticky lg:top-4" aria-label="Event details"><p className="mb-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase text-muted-foreground"><CalendarDays size={12} />Event details</p>{panel}</aside>
        </div>
        {!filtered.length && <p className="mt-4 text-[13px] text-muted-foreground">No events match your search and filters.</p>}
      </main>
      <CalendarUploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </MarketingShell>
  );
}
