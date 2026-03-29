"use client";

import { useState, useEffect, useCallback, useLayoutEffect, useRef, useId } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkflowScope = "CAMPAIGN" | "CAMPAIGN_CREATOR" | "BRAND" | "CREATOR";

const SCOPE_TABS: { label: string; value: WorkflowScope }[] = [
  { label: "Campaign", value: "CAMPAIGN" },
  { label: "Campaign Creator", value: "CAMPAIGN_CREATOR" },
  { label: "Brand", value: "BRAND" },
  { label: "Creator", value: "CREATOR" },
];

type WorkflowDefinitionShape = {
  states: string[];
  transitions: Record<string, string[]>;
  layout?: Record<string, unknown>;
};

type WorkflowDefinitionRow = {
  id: string;
  scope: WorkflowScope;
  version: number;
  isActive: boolean;
  definition: WorkflowDefinitionShape;
  createdAt: string;
};

type WorkflowsListResponse = { data: WorkflowDefinitionRow[] };

function isTerminalState(state: string, transitions: Record<string, string[]>): boolean {
  const out = transitions[state];
  return !out || out.length === 0;
}

function pickDisplayWorkflow(rows: WorkflowDefinitionRow[], scope: WorkflowScope): WorkflowDefinitionRow | null {
  const scoped = rows.filter((w) => w.scope === scope);
  if (scoped.length === 0) return null;
  const active = scoped.find((w) => w.isActive);
  if (active) return active;
  return [...scoped].sort((a, b) => b.version - a.version)[0];
}

function cloneDefinition(def: WorkflowDefinitionShape): WorkflowDefinitionShape {
  return {
    states: [...def.states],
    transitions: Object.fromEntries(
      Object.entries(def.transitions).map(([k, v]) => [k, [...v]])
    ),
    ...(def.layout !== undefined ? { layout: { ...def.layout } } : {}),
  };
}

function toggleTransition(
  transitions: Record<string, string[]>,
  from: string,
  to: string
): Record<string, string[]> {
  const next: Record<string, string[]> = { ...transitions };
  const prev = [...(next[from] ?? [])];
  const i = prev.indexOf(to);
  if (i >= 0) prev.splice(i, 1);
  else prev.push(to);
  if (prev.length === 0) delete next[from];
  else next[from] = prev;
  return next;
}

type Segment =
  | { kind: "line"; x1: number; y1: number; x2: number; y2: number; key: string }
  | { kind: "loop"; cx: number; cy: number; w: number; key: string };

export default function WorkflowsPage() {
  const markerId = useId().replace(/:/g, "");
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());

  const [scope, setScope] = useState<WorkflowScope>("CAMPAIGN");
  const [list, setList] = useState<WorkflowDefinitionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WorkflowDefinitionShape | null>(null);
  const [fromSelection, setFromSelection] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [svgSize, setSvgSize] = useState({ w: 0, h: 0 });
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setList([]);
    setError(null);
    setLoading(true);
    (async () => {
      try {
        const res = await api.get<WorkflowsListResponse>(`/admin/workflows?scope=${scope}`);
        if (!cancelled) setList(res.data ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load workflows");
          setList([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [scope]);

  const refresh = useCallback(async () => {
    try {
      const res = await api.get<WorkflowsListResponse>(`/admin/workflows?scope=${scope}`);
      setList(res.data ?? []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to refresh workflows");
    }
  }, [scope]);

  const activeRow = pickDisplayWorkflow(list, scope);
  const displayDef = editing && draft ? draft : activeRow?.definition ?? { states: [], transitions: {} };

  const recomputeArrows = useCallback(() => {
    const root = containerRef.current;
    if (!root) return;
    const cr = root.getBoundingClientRect();
    setSvgSize({ w: cr.width, h: cr.height });
    const { transitions } = displayDef;
    const next: Segment[] = [];
    for (const [from, tos] of Object.entries(transitions)) {
      for (const to of tos) {
        const elFrom = nodeRefs.current.get(from);
        const elTo = nodeRefs.current.get(to);
        if (!elFrom || !elTo) continue;
        const r1 = elFrom.getBoundingClientRect();
        const r2 = elTo.getBoundingClientRect();
        const x1 = r1.left + r1.width / 2 - cr.left;
        const y1 = r1.top + r1.height / 2 - cr.top;
        const x2 = r2.left + r2.width / 2 - cr.left;
        const y2 = r2.top + r2.height / 2 - cr.top;
        if (from === to) {
          next.push({
            kind: "loop",
            cx: x1,
            cy: y1,
            w: r1.width,
            key: `${from}->${to}`,
          });
        } else {
          next.push({ kind: "line", x1, y1, x2, y2, key: `${from}->${to}` });
        }
      }
    }
    setSegments(next);
  }, [displayDef]);

  useLayoutEffect(() => {
    recomputeArrows();
  }, [recomputeArrows, displayDef.states, displayDef.transitions, scope, editing]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => recomputeArrows());
    ro.observe(root);
    window.addEventListener("scroll", recomputeArrows, true);
    window.addEventListener("resize", recomputeArrows);
    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", recomputeArrows, true);
      window.removeEventListener("resize", recomputeArrows);
    };
  }, [recomputeArrows]);

  const startEdit = () => {
    if (!activeRow) return;
    setDraft(cloneDefinition(activeRow.definition));
    setFromSelection(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(null);
    setFromSelection(null);
    setEditing(false);
  };

  const onStateClick = (state: string) => {
    if (!editing || !draft) return;
    if (fromSelection === null) {
      setFromSelection(state);
      return;
    }
    if (fromSelection === state) {
      setFromSelection(null);
      return;
    }
    setDraft((d) =>
      d
        ? {
            ...d,
            transitions: toggleTransition(d.transitions, fromSelection, state),
          }
        : d
    );
    setFromSelection(null);
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.post(`/admin/workflows`, {
        scope,
        definition: {
          states: draft.states,
          transitions: draft.transitions,
          ...(draft.layout !== undefined ? { layout: draft.layout } : {}),
        },
        setActive: true,
      });
      setSuccess("Workflow saved and activated.");
      setEditing(false);
      setDraft(null);
      setFromSelection(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!success) return;
    const t = window.setTimeout(() => setSuccess(null), 4000);
    return () => window.clearTimeout(t);
  }, [success]);

  const states = displayDef.states ?? [];
  const cols = Math.max(1, Math.ceil(Math.sqrt(Math.max(1, states.length))));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workflows</h1>
        <p className="text-muted-foreground">Admin workflow definitions by scope</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {SCOPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setScope(tab.value);
              setEditing(false);
              setDraft(null);
              setFromSelection(null);
            }}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              scope === tab.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-200">
          {success}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle>Active workflow</CardTitle>
            {activeRow ? (
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Version {activeRow.version}</span>
                {activeRow.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No workflow returned for this scope.</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {!editing ? (
              <Button size="sm" onClick={startEdit} disabled={!activeRow}>
                Edit transitions
              </Button>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={cancelEdit} disabled={saving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={save} disabled={saving || !draft}>
                  {saving ? "Saving…" : "Save & activate"}
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div
            ref={containerRef}
            className="relative min-h-[200px] rounded-lg border border-border bg-muted/20 p-4"
          >
            {states.length === 0 ? (
              <p className="text-sm text-muted-foreground">No states in this definition.</p>
            ) : (
              <>
                <svg
                  className="pointer-events-none absolute left-0 top-0 overflow-visible text-muted-foreground"
                  width={svgSize.w}
                  height={svgSize.h}
                  aria-hidden
                >
                  <defs>
                    <marker
                      id={`arrow-${markerId}`}
                      markerWidth="8"
                      markerHeight="8"
                      refX="7"
                      refY="4"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L8,4 L0,8 z" fill="currentColor" className="text-muted-foreground" />
                    </marker>
                  </defs>
                  {segments.map((s) =>
                    s.kind === "line" ? (
                      <line
                        key={s.key}
                        x1={s.x1}
                        y1={s.y1}
                        x2={s.x2}
                        y2={s.y2}
                        stroke="currentColor"
                        strokeWidth={1.5}
                        markerEnd={`url(#arrow-${markerId})`}
                      />
                    ) : (
                      <path
                        key={s.key}
                        d={`M ${s.cx + s.w * 0.35} ${s.cy - 6} A ${s.w * 0.45} ${s.w * 0.35} 0 1 1 ${s.cx - s.w * 0.35} ${s.cy - 6}`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        markerEnd={`url(#arrow-${markerId})`}
                      />
                    )
                  )}
                </svg>
                <div
                  className="relative z-[1] grid gap-4"
                  style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
                >
                  {states.map((state) => {
                    const terminal = isTerminalState(state, displayDef.transitions);
                    const isFrom = editing && fromSelection === state;
                    return (
                      <button
                        key={state}
                        type="button"
                        disabled={!editing}
                        ref={(el) => {
                          if (el) nodeRefs.current.set(state, el);
                          else nodeRefs.current.delete(state);
                        }}
                        onClick={() => onStateClick(state)}
                        className={cn(
                          "rounded-xl border px-3 py-3 text-center text-sm font-medium shadow-sm transition-colors",
                          terminal
                            ? "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-600 dark:bg-slate-800/60 dark:text-slate-100"
                            : "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-100",
                          editing && "cursor-pointer hover:ring-2 hover:ring-primary/40",
                          isFrom && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                          !editing && "cursor-default"
                        )}
                      >
                        {state}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {editing && (
            <p className="text-sm text-muted-foreground">
              Click a <span className="font-medium text-foreground">from</span> state, then a{" "}
              <span className="font-medium text-foreground">to</span> state to toggle that transition. Click the same
              state again to clear the from selection.
            </p>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-2 text-sm font-semibold">States</h3>
              <ul className="rounded-lg border border-border bg-card p-3 text-sm">
                {states.length === 0 ? (
                  <li className="text-muted-foreground">—</li>
                ) : (
                  states.map((s) => (
                    <li key={s} className="border-b border-border/60 py-1.5 last:border-0">
                      <span className="font-mono text-xs">{s}</span>
                      {isTerminalState(s, displayDef.transitions) ? (
                        <Badge variant="secondary" className="ml-2">
                          terminal
                        </Badge>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-semibold">Transitions</h3>
              <div className="max-h-64 space-y-2 overflow-auto rounded-lg border border-border bg-card p-3 text-sm">
                {Object.keys(displayDef.transitions).length === 0 ? (
                  <p className="text-muted-foreground">No transitions defined.</p>
                ) : (
                  Object.entries(displayDef.transitions)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([from, tos]) => (
                      <div key={from} className="rounded-md bg-muted/40 px-2 py-2 font-mono text-xs">
                        <span className="text-foreground">{from}</span>
                        <span className="text-muted-foreground"> → </span>
                        <span className="text-foreground">{tos.join(", ")}</span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
