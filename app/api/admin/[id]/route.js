import { connectDB } from "@/app/lib/mongodb";
import Item from "@/app/models/items";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

/* ================= PATCH (RESOLVE) ================= */
export async function PATCH(req, context) {
  await connectDB();

  const { params } = context;
  const { id } = await params; // ✅ FIX

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (decoded.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const item = await Item.findByIdAndUpdate(
    id,
    { type: "resolved" },
    { new: true }
  );

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

/* ================= DELETE ================= */
export async function DELETE(req, context) {
  await connectDB();

  const { params } = context;
  const { id } = await params; // ✅ FIX

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  if (decoded.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const item = await Item.findByIdAndDelete(id);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, id });
}
