/**
 * @module scripts/chat
 *
 * A small terminal chat for trying the changing sea room by hand against a running server
 * (`npm run dev` in another terminal, then `npm run chat`).
 *
 * - Type a number to pick that choice, anything else is sent as a typed question.
 * - `/quit` exits.
 * - `API_URL` (default `http://localhost:3001`) and `--seed N` are optional.
 *
 * It only uses Node built-ins (`fetch`, `readline`), so it needs no extra packages.
 */
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const API_URL = process.env.API_URL ?? 'http://localhost:3001';

/** The parts of a `TurnResponse` (spec §13.3) this script prints. */
interface View {
  sessionId?: string;
  status?: string;
  reply?: { kind?: string; text?: string; label?: string | null };
  facts?: { eventId: string; event: string; sources?: { publisher: string; url: string }[] }[];
  choices?: { id: string; label: string }[];
  progress?: { favourBand?: string; tokens?: number };
  effects?: string[];
  error?: { code: string; message: string };
}

/** Writes one line to the terminal. */
function say(line = ''): void {
  stdout.write(`${line}\n`);
}

/**
 * Sends a JSON request to the API.
 *
 * @param path - Route path, e.g. `/api/sessions`.
 * @param body - JSON body.
 * @returns The HTTP status and the parsed body.
 */
async function post(path: string, body: unknown): Promise<{ status: number; view: View }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const view = (await res.json().catch(() => ({}))) as View;
  return { status: res.status, view };
}

/**
 * Prints a view: the reply, its facts and sources, mood and the numbered choices.
 *
 * @param status - HTTP status of the response.
 * @param view - The response body.
 */
function show(status: number, view: View): void {
  if (view.error) {
    say(`  [${status}] ${view.error.code}: ${view.error.message}`);
    return;
  }
  const label = view.reply?.label ? ` (${view.reply.label})` : '';
  say(`\n${view.reply?.kind ?? '?'}${label}: ${view.reply?.text ?? ''}`);
  for (const fact of view.facts ?? []) {
    say(`  • ${fact.eventId} ${fact.event}`);
    for (const source of fact.sources ?? []) say(`      ${source.publisher}: ${source.url}`);
  }
  const effects = view.effects?.length ? ` effects: ${view.effects.join(', ')}` : '';
  say(
    `  [${view.status} · ${view.progress?.favourBand} · tokens ${view.progress?.tokens}]${effects}`,
  );
  (view.choices ?? []).forEach((choice, i) => say(`  ${i + 1}. ${choice.label}`));
}

/** Starts a visit and loops: read a line, send it, print the reply. */
async function main(): Promise<void> {
  const seedArg = process.argv.indexOf('--seed');
  const seed = seedArg > -1 ? Number(process.argv[seedArg + 1]) : undefined;

  const start = await post('/api/sessions', {
    room: 'changing-sea',
    ...(seed === undefined ? {} : { seed }),
  });
  show(start.status, start.view);
  const sessionId = start.view.sessionId;
  if (!sessionId) {
    say('Could not start a visit (is the session API built and the server running?).');
    return;
  }

  let choices = start.view.choices ?? [];
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    for (;;) {
      const line = (await rl.question('\n> ')).trim();
      if (line === '/quit') break;
      const picked = /^\d+$/.test(line) ? choices[Number(line) - 1] : undefined;
      const body = picked ? { type: 'choice', choiceId: picked.id } : { type: 'text', text: line };
      const { status, view } = await post(`/api/sessions/${sessionId}/turns`, body);
      show(status, view);
      if (!view.error) choices = view.choices ?? [];
      if (view.status === 'ended') break;
    }
  } finally {
    rl.close();
  }
}

main().catch((err: unknown) => {
  say(`Chat failed: ${(err as Error).message} (is the server running at ${API_URL}?)`);
  process.exitCode = 1;
});
