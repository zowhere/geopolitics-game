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
import type { Game, GameSnapshot, GameStatus } from "../game/Game";
import { auth, db } from "./firebase";

export type SavedGame = {
  id: string;
  ownerId: string;
  status: GameStatus;
  snapshot: GameSnapshot;
};

export class GameStore {
  private readonly created = new Set<string>();

  newId() {
    return doc(collection(db, "games")).id;
  }

  async save(id: string, game: Game) {
    const ownerId = auth.currentUser?.uid;
    if (!ownerId) return;

    const ref = doc(db, "games", id);
    const data = { ownerId, status: game.status, ...game.snapshot(), updatedAt: serverTimestamp() };
    if (this.created.has(id)) return updateDoc(ref, data);

    this.created.add(id);
    try {
      await setDoc(ref, { ...data, createdAt: serverTimestamp() });
    } catch (error) {
      this.created.delete(id);
      throw error;
    }
  }

  async list(): Promise<SavedGame[]> {
    const ownerId = auth.currentUser?.uid;
    if (!ownerId) return [];

    const snapshot = await getDocs(
      query(collection(db, "games"), where("ownerId", "==", ownerId), orderBy("updatedAt", "desc")),
    );
    return snapshot.docs.map((entry) => {
      this.created.add(entry.id);
      return this.toSaved(entry.id, entry.data());
    });
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
    const { ownerId, status, human, round, turn, reserve, nations } = data;
    return { id, ownerId, status, snapshot: { human, round, turn, reserve, nations } };
  }
}

export const gameStore = new GameStore();
