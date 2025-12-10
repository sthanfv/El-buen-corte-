import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
export async function GET() {
  try {
    const snap = await adminDb.collection("products").orderBy("createdAt", "desc").get();

    const items = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    return NextResponse.json(items);
  } catch (e: any) {
    console.error("Error in /api/products/list:", e);
    return NextResponse.json({ error: e.message || "Something went wrong" }, { status: 500 });
  }
}
