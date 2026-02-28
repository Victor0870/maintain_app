import { NextRequest, NextResponse } from "next/server";
import * as admin from "firebase-admin";

function getAdminApp() {
  if (admin.apps.length > 0) return admin.app();
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !privateKey) {
    return null;
  }
  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

export async function POST(request: NextRequest) {
  try {
    const app = getAdminApp();
    if (!app) {
      return NextResponse.json(
        { error: "Firebase Admin chưa cấu hình. Thêm FIREBASE_ADMIN_* vào biến môi trường." },
        { status: 503 }
      );
    }
    const body = await request.json();
    const { email, password, displayName } = body as { email?: string; password?: string; displayName?: string };
    if (!email || !password) {
      return NextResponse.json(
        { error: "Thiếu email hoặc mật khẩu." },
        { status: 400 }
      );
    }
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || undefined,
      emailVerified: false,
    });
    return NextResponse.json({
      uid: userRecord.uid,
      email: userRecord.email,
      message: "Đã tạo tài khoản. Gửi email và mật khẩu cho người dùng để đăng nhập.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi tạo tài khoản.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
