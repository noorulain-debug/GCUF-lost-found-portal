import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();
  const { email, password } = await req.json();

  const user = await User.findOne({ email });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 400 });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return NextResponse.json({ error: "Wrong password" }, { status: 400 });
  }

  const token = jwt.sign(
  { id: user._id, role: user.role }, 
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);
  const res = NextResponse.json({ message: "Logged in" });

  // Set a session cookie (no maxAge/expires) so it is cleared when the
  // browser process is closed. If you want logout on tab close instead,
  // the client needs to notify the server on unload (see ClientProvider).
  res.cookies.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res;
}
