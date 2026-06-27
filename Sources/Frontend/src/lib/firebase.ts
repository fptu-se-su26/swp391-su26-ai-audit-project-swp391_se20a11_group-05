/**
 * firebase.ts — Firebase Client SDK initialization
 *
 * Config được đọc từ biến môi trường VITE_FIREBASE_* trong .env.local
 * Để setup:
 *   1. Vào Firebase Console → Project Settings → Web App
 *   2. Copy config vào .env.local (xem .env.local.example)
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type Auth,
} from "firebase/auth";

// ─── Firebase Config (from VITE env vars) ─────────────────────
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// ─── Singleton initialization ─────────────────────────────────
let app: FirebaseApp;
let auth: Auth;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    // Tránh khởi tạo lại khi HMR (hot module reload) trong dev
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  return app;
}

function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

// ─── Google Sign-In ───────────────────────────────────────────

export interface GoogleSignInResult {
  /** Firebase ID Token — gửi lên backend để xác thực */
  idToken: string;
  /** Email từ tài khoản Google */
  email: string | null;
  /** Tên hiển thị từ Google */
  displayName: string | null;
  /** Avatar URL */
  photoURL: string | null;
}

/**
 * Mở popup Google Sign-In và trả về Firebase ID Token cùng thông tin user.
 * Ném lỗi nếu user đóng popup hoặc có lỗi xảy ra.
 */
export async function signInWithGoogle(): Promise<GoogleSignInResult> {
  const authInstance = getFirebaseAuth();
  const provider = new GoogleAuthProvider();

  // Yêu cầu chọn tài khoản mỗi lần (tránh tự động login bằng tài khoản cũ)
  provider.setCustomParameters({ prompt: "select_account" });

  const result = await signInWithPopup(authInstance, provider);
  const idToken = await result.user.getIdToken();

  return {
    idToken,
    email: result.user.email,
    displayName: result.user.displayName,
    photoURL: result.user.photoURL,
  };
}

/**
 * Đăng xuất khỏi Firebase (client-side only).
 * Không ảnh hưởng đến session backend.
 */
export async function signOutFirebase(): Promise<void> {
  await signOut(getFirebaseAuth());
}
