// Privacy-preserving analytics: only event names, counts, durations and verdicts.
// Never log statement contents, labels, amounts or personal data.

export interface ToolEvent {
  tool: string;
  outcome: 'success' | 'invalid_input' | 'error';
  durationMs: number;
  verdict?: string;
  findingCount?: number;
  errorCount?: number;
}

export type Sink = (e: ToolEvent & { ts: string }) => void;

let sink: Sink = (e) => process.stdout.write(`${JSON.stringify({ type: 'tool_event', ...e })}\n`);

export function setAnalyticsSink(s: Sink): void {
  sink = s;
}

export function track(e: ToolEvent): void {
  try {
    sink({ ...e, ts: new Date().toISOString() });
  } catch {
    // analytics must never break a tool call
  }
}
