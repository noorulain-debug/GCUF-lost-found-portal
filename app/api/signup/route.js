import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req) {
  await connectDB();

  const { name, email, phone, password } = await req.json(); 

 
  const userExists = await User.findOne({ email });
  if (userExists) {
    return NextResponse.json({ error: "User already exists" }, { status: 400 });
  }


  const phoneExists = await User.findOne({ phone });
  if (phoneExists) {
    return NextResponse.json(
      { error: "Phone number already registered" },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  await User.create({
    name,
    email,
    phone,        
    password: hashed,
  });

  return NextResponse.json({ message: "User registered successfully" });
}
