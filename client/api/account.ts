import { createSign } from "node:crypto";

const webApiKey = "AIzaSyB5Y-RWE1DxrtB7DruA0gH3opo5ANoTA40";
const identity = "https://identitytoolkit.googleapis.com/v1";
const customTokenAudience = "https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit";
const failsBeforeWait = 3;
const failsBeforeLock = 10;
const waitTime = 15 * 60 * 1000;
const wrongLogin = "Wrong username or password";

type Body = { action?: unknown; username?: unknown; password?: unknown };
type ServiceAccount = { project_id: string; client_email: string; private_key: string };
type Fields = Record<string, { stringValue?: string; integerValue?: string; timestampValue?: string }>;

const isUsername = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_]{3,20}$/.test(value);
const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");

class AccountService {
  readonly #account: ServiceAccount;
  readonly #documents: string;
  #accessToken: Promise<string> | null = null;

  constructor(account: ServiceAccount) {
    this.#account = account;
    this.#documents = `https://firestore.googleapis.com/v1/projects/${account.project_id}/databases/(default)/documents`;
  }

  async logIn(username: string, password: string) {
    const attemptsPath = `loginAttempts/${username.toLowerCase()}`;
    const record = await this.#read(attemptsPath);
    const total = Number(record?.total?.integerValue ?? 0);
    const fails = Number(record?.fails?.integerValue ?? 0);
    const lastFail = Date.parse(record?.lastFail?.timestampValue ?? "") || 0;
    const recent = Date.now() - lastFail < waitTime;
    if (total >= failsBeforeLock)
      return Response.json({ error: "This account is locked. Contact the game owner to unlock it" }, { status: 403 });
    if (recent && fails >= failsBeforeWait)
      return Response.json({ error: "Too many tries. Wait 15 minutes" }, { status: 429 });

    const account = await this.#accountFor(username);
    if (!account || !(await this.#passwordMatches(account.email, password))) {
      await this.#write(attemptsPath, {
        fails: { integerValue: String(recent ? fails + 1 : 1) },
        total: { integerValue: String(total + 1) },
        lastFail: { timestampValue: new Date().toISOString() },
      });
      return Response.json({ error: wrongLogin }, { status: 401 });
    }

    if (record) await this.#call(`${this.#documents}/${attemptsPath}`, { method: "DELETE" });
    return Response.json({ token: this.#customToken(account.uid) });
  }

  async #accountFor(username: string) {
    const uid = (await this.#read(`usernames/${username.toLowerCase()}`))?.uid?.stringValue;
    if (!uid) return null;
    const response = await this.#call(`${identity}/projects/${this.#account.project_id}/accounts:lookup`, {
      method: "POST",
      body: JSON.stringify({ localId: [uid] }),
    });
    const { users } = (await response.json()) as { users?: { email?: unknown }[] };
    const email = users?.[0]?.email;
    return typeof email === "string" ? { uid, email } : null;
  }

  async #passwordMatches(email: string, password: string) {
    const response = await fetch(`${identity}/accounts:signInWithPassword?key=${webApiKey}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: false }),
    });
    return response.ok;
  }

  async #read(path: string): Promise<Fields | null> {
    const response = await this.#call(`${this.#documents}/${path}`, { method: "GET" });
    if (response.status === 404) return null;
    return ((await response.json()) as { fields?: Fields }).fields ?? {};
  }

  async #write(path: string, fields: Fields) {
    await this.#call(`${this.#documents}/${path}`, { method: "PATCH", body: JSON.stringify({ fields }) });
  }

  async #call(url: string, init: RequestInit) {
    const response = await fetch(url, {
      ...init,
      headers: { "content-type": "application/json", authorization: `Bearer ${await this.#token()}` },
    });
    if (!response.ok && response.status !== 404) throw new Error(`google ${response.status} ${await response.text()}`);
    return response;
  }

  #token() {
    this.#accessToken ??= (async () => {
      const assertion = this.#sign({
        iss: this.#account.client_email,
        scope: "https://www.googleapis.com/auth/cloud-platform",
        aud: "https://oauth2.googleapis.com/token",
      });
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
      });
      if (!response.ok) throw new Error(`google token ${response.status}`);
      return ((await response.json()) as { access_token: string }).access_token;
    })();
    return this.#accessToken;
  }

  #customToken(uid: string) {
    return this.#sign({ iss: this.#account.client_email, sub: this.#account.client_email, aud: customTokenAudience, uid });
  }

  #sign(claims: object) {
    const now = Math.floor(Date.now() / 1000);
    const body = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ ...claims, iat: now, exp: now + 3600 })}`;
    return `${body}.${createSign("RSA-SHA256").update(body).sign(this.#account.private_key, "base64url")}`;
  }
}

function service() {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  return serviceAccount ? new AccountService(JSON.parse(serviceAccount)) : null;
}

export async function POST(request: Request) {
  const { action, username, password } = ((await request.json().catch(() => null)) ?? {}) as Body;
  if (!isUsername(username)) return Response.json({ error: wrongLogin }, { status: 400 });
  if (action === "login" && (typeof password !== "string" || !password))
    return Response.json({ error: wrongLogin }, { status: 400 });
  if (action !== "login") return Response.json({ error: "bad request" }, { status: 400 });

  try {
    const accounts = service();
    if (!accounts) return Response.json({ error: "Login is not set up" }, { status: 503 });
    return await accounts.logIn(username, password as string);
  } catch (error) {
    console.error("account error", error);
    return Response.json({ error: "Something went wrong" }, { status: 500 });
  }
}
