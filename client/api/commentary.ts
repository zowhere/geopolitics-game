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

type Phrases = { attack: string; defend: string; result: string };

const instructions = [
  "You are a lively war commentator for a strategy board game.",
  'Describe one dice battle as JSON with three short phrases: "attack" (what the attacker did, 3 to 7 words),',
  '"defend" (how the defender answered, 3 to 7 words) and "result" (who lost soldiers, 4 to 9 words).',
  "Each die is one soldier. Never mention dice values or numbers rolled, the dice are already on screen.",
  "Only use the facts given. Do not invent events, places or people.",
].join(" ");

const isPhrase = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= 80;

function readPhrases(content: unknown): Phrases | null {
  if (typeof content !== "string") return null;
  try {
    const { attack, defend, result } = JSON.parse(content);
    if (!isPhrase(attack) || !isPhrase(defend) || !isPhrase(result)) return null;
    const tidy = (phrase: string) => phrase.trim().replace(/[.,;!]+$/, "");
    return { attack: tidy(attack), defend: tidy(defend), result: tidy(result) };
  } catch {
    return null;
  }
}

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
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: instructions },
          { role: "user", content: JSON.stringify(facts) },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`groq ${response.status}`);
    const data = (await response.json()) as GroqReply;
    const phrases = readPhrases(data.choices?.[0]?.message?.content);
    if (!phrases) throw new Error("groq unreadable");
    return phrases;
  }
}

export async function POST(request: Request) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return Response.json({ error: "not set up" }, { status: 503 });
  const facts = readFacts(await request.json().catch(() => null));
  if (!facts) return Response.json({ error: "bad battle" }, { status: 400 });
  try {
    const phrases = await new GroqCommentator(key).describe(facts);
    const text = `${phrases.attack}, ${phrases.defend}, ${phrases.result}.`;
    return Response.json({ text, phrases });
  } catch {
    return Response.json({ error: "no commentary" }, { status: 502 });
  }
}
