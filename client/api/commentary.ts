type BattleFacts = {
  attacker: string;
  defender: string;
  attackerDice: number[];
  defenderDice: number[];
  attackerLosses: number;
  defenderLosses: number;
};

type GeminiReply = {
  candidates?: { content?: { parts?: { text?: unknown }[] } }[];
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

class GeminiCommentator {
  readonly #key: string;
  readonly #model = "gemini-flash-latest";

  constructor(key: string) {
    this.#key = key;
  }

  async describe(facts: BattleFacts) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.#model}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": this.#key },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: this.#prompt(facts) }] }] }),
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!response.ok) throw new Error(`gemini ${response.status}`);
    const data = (await response.json()) as GeminiReply;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== "string" || !text.trim()) throw new Error("gemini empty");
    return text.trim();
  }

  #prompt(facts: BattleFacts) {
    return [
      "You are a war commentator for a strategy board game.",
      "Describe this dice battle in one or two short, punchy sentences.",
      "Only use the facts given. Do not invent events, places, people or numbers.",
      JSON.stringify(facts),
    ].join("\n");
  }
}

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: "not set up" }, { status: 503 });
  const facts = readFacts(await request.json().catch(() => null));
  if (!facts) return Response.json({ error: "bad battle" }, { status: 400 });
  try {
    return Response.json({ text: await new GeminiCommentator(key).describe(facts) });
  } catch {
    return Response.json({ error: "no commentary" }, { status: 502 });
  }
}
