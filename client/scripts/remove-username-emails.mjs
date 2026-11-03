import { applicationDefault, initializeApp } from "firebase-admin/app";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const projectIdArg = process.argv.find((arg) => arg.startsWith("--project="));
const projectId = projectIdArg?.split("=")[1] ?? process.env.GOOGLE_CLOUD_PROJECT;
const confirmed = process.argv.includes("--confirm");

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();

const withEmail = (await db.collection("usernames").get()).docs.filter((entry) => entry.get("email") !== undefined);
console.log(`${withEmail.length} username records still hold an email.`);

if (!confirmed) {
  console.log("Dry run: nothing changed. Rerun with --confirm to remove the emails.");
  process.exit(0);
}

const batch = db.batch();
for (const entry of withEmail) batch.update(entry.ref, { email: FieldValue.delete() });
await batch.commit();
console.log(`Removed the email from ${withEmail.length} username records.`);
