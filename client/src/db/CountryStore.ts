import { collection, getDocs } from "firebase/firestore";
import { withSoldiers, type Country } from "../game/countries";
import { db } from "./firebase";

export class CountryStore {
  async load(): Promise<Country[]> {
    const snapshot = await getDocs(collection(db, "countries"));
    if (snapshot.empty) throw new Error("No countries in the database");

    return snapshot.docs.map((entry) => {
      const { name, code, mapName, population } = entry.data();
      return withSoldiers({ name, code, mapName, population });
    });
  }
}

export const countryStore = new CountryStore();
