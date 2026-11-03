import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const webApiKey = "AIzaSyB5Y-RWE1DxrtB7DruA0gH3opo5ANoTA40";
const identity = "https://identitytoolkit.googleapis.com/v1/accounts";
const failsBeforeWait = 3;
const failsBeforeLock = 10;
const waitTime = 15 * 60 * 1000;
const wrongLogin = "Wrong username or password";

type Body = { action?: unknown; username?: unknown; password?: unknown };

const isUsername = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_]{3,20}$/.test(value);

class AccountService {
  readonly #db = getFirestore();
  readonly #auth = getAuth();

  async logIn(username: string, password: string) {
    const attempts = this.#db.doc(`loginAttempts/${username.toLowerCase()}`);
    const record = await attempts.get();
    const total: number = record.get("total") ?? 0;
    const fails: number = record.get("fails") ?? 0;
    const recent = Date.now() - (record.get("lastFail")?.toMillis() ?? 0) < waitTime;
    if (total >= failsBeforeLock)
      return Response.json({ error: "This account is locked. Contact the game owner to unlock it" }, { status: 403 });
    if (recent && fails >= failsBeforeWait)
      return Response.json({ error: "Too many tries. Wait 15 minutes" }, { status: 429 });

    const account = await this.#accountFor(username);
    if (!account || !(await this.#passwordMatches(account.email, password))) {
      await attempts.set({ fails: recent ? fails + 1 : 1, total: total + 1, lastFail: Timestamp.now() });
      return Response.json({ error: wrongLogin }, { status: 401 });
    }

    await attempts.delete();
    return Response.json({ token: await this.#auth.createCustomToken(account.uid) });
  }

  async #accountFor(username: string) {
    const name = await this.#db.doc(`usernames/${username.toLowerCase()}`).get();
    const uid = name.get("uid");
    if (typeof uid !== "string") return null;
    const user = await this.#auth.getUser(uid).catch(() => null);
    return user?.email ? { uid, email: user.email } : null;
  }

  async #passwordMatches(email: string, password: string) {
    const response = await fetch(`${identity}:signInWithPassword?key=${webApiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    });
    return response.ok;
  }
}

function service() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) return null;
  if (!getApps().length) initializeApp({ credential: cert(JSON.parse(serviceAccount)) });
  return new AccountService();
}

export async function POST(request: Request) {
  const { action, username, password } = ((await request.json().catch(() => null)) ?? {}) as Body;
  if (!isUsername(username)) return Response.json({ error: wrongLogin }, { status: 400 });
  if (action === "login" && (typeof password !== "string" || !password))
    return Response.json({ error: wrongLogin }, { status: 400 });
  if (action !== "login") return Response.json({ error: "bad request" }, { status: 400 });

  const accounts = service();
  if (!accounts) return Response.json({ error: "Login is not set up" }, { status: 503 });
  try {
    return await accounts.logIn(username, password as string);
  } catch (error) {
    console.error("account error", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
