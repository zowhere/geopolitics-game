import {
  collection,
  doc,
  getDocFromCache,
  getDocFromServer,
  getDocsFromCache,
  getDocsFromServer,
} from "firebase/firestore";
import { withSoldiers, type Country } from "../game/countries";
import { db } from "./firebase";

export class CountryStore {
  private loading: Promise<Country[]> | null = null;

  load() {
    this.loading ??= this.fetch().catch((error) => {
      this.loading = null;
      throw error;
    });
    return this.loading;
  }

  // One read of meta/countries tells us if the cached list is still current
  private async fetch(): Promise<Country[]> {
    const countries = collection(db, "countries");
    const meta = doc(db, "meta", "countries");
    const cachedMeta = await getDocFromCache(meta).catch(() => null);
    const liveMeta = await getDocFromServer(meta);
    const upToDate = cachedMeta?.get("updatedAt")?.isEqual?.(liveMeta.get("updatedAt"));

    const cached = upToDate ? await getDocsFromCache(countries).catch(() => null) : null;
    const snapshot = cached && !cached.empty ? cached : await getDocsFromServer(countries);
    if (snapshot.empty) throw new Error("No countries in the database");

    return snapshot.docs.map((entry) => {
      const { name, code, mapName, population } = entry.data();
      return withSoldiers({ name, code, mapName, population });
    });
  }
}

export const countryStore = new CountryStore();
