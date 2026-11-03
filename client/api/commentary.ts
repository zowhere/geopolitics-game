type BattleFacts = {
  attacker: string;
  defender: string;
  attackerDice: number[];
  defenderDice: number[];
  attackerLosses: number;
  defenderLosses: number;
};

type GroqReply = {
  choices?: { message?: { content?: unknown } }[];
};

const isName =(value: unknown) => typeof value === "string" && value.length > 0 && value.length <= 40;
const isDice = (value: unknown) =>
  Array.isArray(value) && value.length > 0 && value.length <= 50 && value.every((die) => Number.isInteger(die) && die >= 1 && die <= 6);
const isCount = (value: unknown) => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 50;

function readFacts(body: unknown): BattleFacts | null {
  const facts = body as Partial<BattleFacts> | null;
  if (!facts || !isName(facts.attacker) || !isName(facts.defender)) return null;
  if (!isDice(facts.attackerDice) || !isDice(facts.defenderDice)) return null;
  if (facts.attackerDice!.length !== facts.defenderDice!.length) return null;
  if (!isCount(facts.attackerLosses) || !isCount(facts.defenderLosses)) return null;
  return facts as BattleFacts;
}

const instructions = [
  "You are a war commentator for a strategy board game.",
  "Describe the dice battle in one or two short, punchy sentences.",
  "Each die is one soldier, so a lost die is a soldier lost.",
  "Only use the facts given. Do not invent events, places, people or numbers.",
].join(" ");

class GroqCommentator {
  readonly #key: string;
  readonly #model = "openai/gpt-oss-20b";

  constructor(key: string) {
    this.#key = key;
  }

  async describe(facts: BattleFacts) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${this.#key}` },
      body: JSON.stringify({
        model: this.#model,
        reasoning_effort: "low",
        max_completion_tokens: 300,
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: JSON.stringify(facts) },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`groq ${response.status}`);
    const data = (await response.json()) as GroqReply;
    const text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) throw new Error("groq empty");
    return text.trim();
  }
}

export async function POST(request: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ error: "not set up" }, { status: 503 });
  const facts = readFacts(await request.json().catch(() => null));
  if (!facts) return Response.json({ error: "bad battle" }, { status: 400 });
  try {
    return Response.json({ text: await new GroqCommentator(key).describe(facts) });
  } catch {
    return Response.json({ error: "no commentary" }, { status: 502 });
  }
}
