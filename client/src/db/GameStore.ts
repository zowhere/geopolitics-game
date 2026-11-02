import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Game, GameSnapshot, GameStatus } from "../game/Game";
import { auth, db } from "./firebase";

export type SavedGame = {
  id: string;
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
      const { status, human, round, turn, reserve, nations } = entry.data();
      this.created.add(entry.id);
      return { id: entry.id, status, snapshot: { human, round, turn, reserve, nations } };
    });
  }
}

export const gameStore = new GameStore();
