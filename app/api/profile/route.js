import jwt from "jsonwebtoken";
import User from "@/app/models/user";
import { connectDB } from "@/app/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(req) {
  await connectDB();

  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password -__v");
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

   return NextResponse.json({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,

  avatar: user.avatar,
  location: user.location,
  joinDate: user.createdAt,
});
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function PUT(req) {
  await connectDB();

  const token = req.cookies.get("token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const body = await req.json();

    const updatedUser = await User.findByIdAndUpdate(
      decoded.id,
      {
        name: body.name,
        email: body.email,
        phone: body.phone,
        location: body.location,
        avatar: body.avatar,
      },
      { new: true }
    ).select("-password -__v");

    return NextResponse.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      location: updatedUser.location,
      avatar: updatedUser.avatar,
      joinDate: updatedUser.createdAt,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
