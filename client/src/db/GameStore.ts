import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import type { Game, GameSnapshot, GameStatus, Roll } from "../game/Game";
import { auth, db } from "./firebase";

export type SavedGame = {
  id: string;
  ownerId: string;
  status: GameStatus;
  snapshot: GameSnapshot;
  roll: Roll | null;
};

export type SaveState = "idle" | "saving" | "saved" | "failed";

type PendingSave = { id: string; game: Game };

export class GameStore {
  private rollTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingRoll: PendingSave | null = null;
  private creating: Promise<void> = Promise.resolve();
  private latest: PendingSave | null = null;
  private failed: PendingSave | null = null;
  private saving = false;
  private state: SaveState = "idle";
  private readonly listeners = new Set<(state: SaveState) => void>();

  newId() {
    return doc(collection(db, "games")).id;
  }

  create(id: string, game: Game) {
    const ownerId = auth.currentUser?.uid;
    if (!ownerId) return Promise.resolve();
    const data = { ownerId, status: game.status, ...game.snapshot() };
    this.creating = setDoc(doc(db, "games", id), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return this.creating;
  }

  save(id: string, game: Game) {
    if (!auth.currentUser) return;
    this.latest = { id, game };
    void this.drain();
  }

  retry() {
    if (this.failed) this.save(this.failed.id, this.failed.game);
  }

  onSaveState(listener: (state: SaveState) => void) {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setState(state: SaveState) {
    this.state = state;
    for (const listener of this.listeners) listener(state);
  }

  private async drain() {
    if (this.saving) return;
    this.saving = true;
    while (this.latest) {
      const { id, game } = this.latest;
      this.latest = null;
      this.setState("saving");
      try {
        await this.creating;
        await updateDoc(doc(db, "games", id), { status: game.status, ...game.snapshot(), updatedAt: serverTimestamp() });
        this.failed = null;
        this.setState("saved");
      } catch (error) {
        console.error("Couldn't save the game", error);
        this.failed = { id, game };
        this.setState("failed");
        break;
      }
    }
    this.saving = false;
  }

  saveRoll(id: string, game: Game) {
    this.pendingRoll = { id, game };
    if (this.rollTimer) return;
    this.flushRoll();
  }

  private flushRoll() {
    const pending = this.pendingRoll;
    this.pendingRoll = null;
    if (!pending) {
      this.rollTimer = null;
      return;
    }
    updateDoc(doc(db, "games", pending.id), { roll: pending.game.roll, updatedAt: serverTimestamp() }).catch(
      (error) => console.error("Couldn't send the roll", error),
    );
    this.rollTimer = setTimeout(() => this.flushRoll(), 1000);
  }

  async list(): Promise<SavedGame[]> {
    const ownerId = auth.currentUser?.uid;
    if (!ownerId) return [];

    const snapshot = await getDocs(
      query(collection(db, "games"), where("ownerId", "==", ownerId), orderBy("updatedAt", "desc")),
    );
    return snapshot.docs.map((entry) => this.toSaved(entry.id, entry.data()));
  }

  watch(id: string, onChange: (saved: SavedGame | null) => void, onError: () => void) {
    return onSnapshot(
      doc(db, "games", id),
      (entry) => onChange(entry.exists() ? this.toSaved(entry.id, entry.data()) : null),
      onError,
    );
  }

  async ownerName(ownerId: string) {
    const snapshot = await getDocs(
      query(collection(db, "usernames"), where("uid", "==", ownerId), limit(1)),
    );
    return snapshot.docs[0]?.id ?? "a player";
  }

  private toSaved(id: string, data: DocumentData): SavedGame {
    const { ownerId, status, human, round, turn, reserve, nations, attacked, war, roll } = data;
    return {
      id,
      ownerId,
      status,
      snapshot: { human, round, turn, reserve, nations, attacked: attacked ?? false, war: war ?? null },
      roll: roll ?? null,
    };
  }
}

export const gameStore = new GameStore();
