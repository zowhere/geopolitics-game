import { FirebaseError } from "firebase/app";
import {
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth, db } from "./firebase";

export type Account = {
  uid: string;
  username: string;
};

const messages: Record<string, string> = {
  "auth/email-already-in-use": "That email already has an account",
  "auth/invalid-email": "That email doesn't look right",
  "auth/weak-password": "Password: at least 6 characters",
  "auth/invalid-credential": "Wrong username or password",
  "auth/too-many-requests": "Too many tries, wait a bit",
  "auth/network-request-failed": "No connection",
  "auth/expired-action-code": "This link has expired, ask for a new one",
  "auth/invalid-action-code": "This link has already been used or is broken",
};

export class AccountStore {
  async signUp(email: string, username: string, password: string): Promise<Account> {
    return this.friendly(async () => {
      const name = doc(db, "usernames", username.toLowerCase());
      if ((await getDoc(name)).exists()) throw new Error("That username is taken");

      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      const savedEmail = user.email ?? email;
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, "users", user.uid), { username, createdAt: serverTimestamp() });
        batch.set(name, { uid: user.uid, email: savedEmail });
        await batch.commit();
        await updateProfile(user, { displayName: username });
      } catch (error) {
        await deleteUser(user);
        throw error;
      }
      return { uid: user.uid, username };
    });
  }

  async logIn(username: string, password: string): Promise<Account> {
    return this.friendly(async () => {
      const name = await getDoc(doc(db, "usernames", username.toLowerCase()));
      if (!name.exists()) throw new Error(messages["auth/invalid-credential"]);

      const { user } = await signInWithEmailAndPassword(auth, name.data().email, password);
      return { uid: user.uid, username: user.displayName ?? username };
    });
  }

  async resetPassword(username: string) {
    return this.friendly(async () => {
      const name = await getDoc(doc(db, "usernames", username.toLowerCase()));
      if (name.exists()) await sendPasswordResetEmail(auth, name.data().email);
    });
  }

  checkResetLink(code: string) {
    return this.friendly(() => verifyPasswordResetCode(auth, code));
  }

  setNewPassword(code: string, password: string) {
    return this.friendly(() => confirmPasswordReset(auth, code, password));
  }

  logOut() {
    return signOut(auth);
  }

  onChange(callback: (account: Account | null) => void) {
    return onAuthStateChanged(auth, (user) =>
      callback(user?.displayName ? { uid: user.uid, username: user.displayName } : null),
    );
  }

  private async friendly<T>(action: () => Promise<T>) {
    try {
      return await action();
    } catch (error) {
      if (error instanceof FirebaseError) throw new Error(messages[error.code] ?? "Something went wrong");
      throw error;
    }
  }
}

export const accounts = new AccountStore();
