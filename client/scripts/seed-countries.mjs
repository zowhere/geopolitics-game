import { readFile } from "node:fs/promises";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const sourceUrl =
  "https://www.worldometers.info/world-population/population-by-country/";
const projectIdArg = process.argv.find((arg) => arg.startsWith("--project="));
const projectId =
  projectIdArg?.split("=")[1] ?? process.env.GOOGLE_CLOUD_PROJECT;
const confirmed = process.argv.includes("--confirm");
const countriesPath = new URL("./countries.json", import.meta.url);
const countries = JSON.parse(await readFile(countriesPath, "utf8"));
const countryDocs = countries.map(({ name, code, mapName, population }) => ({
  name,
  code,
  mapName,
  population,
}));

if (!confirmed) {
  console.log(
    `Dry run: ${countryDocs.length} country documents ready for Firestore.`,
  );
  console.log(
    "No database writes made. Review the data, then rerun with --confirm to seed.",
  );
  console.log(
    "Example:",
    JSON.stringify(
      countryDocs.find((country) => country.code === "us"),
      null,
      2,
    ),
  );
  process.exit(0);
}

if (!projectId) {
  throw new Error(
    "Set GOOGLE_CLOUD_PROJECT or pass --project=<geopolitics-game-b9b31>.",
  );
}

const app = initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore(app);
const batch = db.batch();

for (const country of countryDocs) {
  batch.set(db.collection("countries").doc(country.code), country);
}
batch.set(db.collection("meta").doc("countries"), {
  populationYear: 2026,
  populationSource: sourceUrl,
});

await batch.commit();
console.log(
  `Seeded ${countryDocs.length} documents into ${projectId}/countries.`,
);
await app.delete();
