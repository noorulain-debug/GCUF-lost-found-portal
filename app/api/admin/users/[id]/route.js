import { connectDB } from "@/app/lib/mongodb";
import User from "@/app/models/user";
import Item from "@/app/models/items";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

async function requireAdmin(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "admin") {
      return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
    }

    return { decoded };
  } catch {
    return { error: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
  }
}

export async function PATCH(req, context) {
  await connectDB();

  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await context.params;
  const { role } = await req.json();

  if (!["user", "admin"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (String(auth.decoded.id) === String(id) && role !== "admin") {
    return NextResponse.json(
      { error: "You cannot remove your own admin access" },
      { status: 400 }
    );
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select("-password -__v");

  if (!updatedUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const totalItems = await Item.countDocuments({ user: id });
  const resolvedItems = await Item.countDocuments({ user: id, type: "resolved" });

  return NextResponse.json({
    id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    phone: updatedUser.phone,
    role: updatedUser.role,
    avatar: updatedUser.avatar,
    bio: updatedUser.bio,
    location: updatedUser.location,
    createdAt: updatedUser.createdAt,
    updatedAt: updatedUser.updatedAt,
    totalItems,
    resolvedItems,
  });
}

export async function DELETE(req, context) {
  await connectDB();

  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const { id } = await context.params;

  if (String(auth.decoded.id) === String(id)) {
    return NextResponse.json(
      { error: "You cannot delete your own account from the admin panel" },
      { status: 400 }
    );
  }

  const user = await User.findById(id);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await Item.deleteMany({ user: id });
  await User.findByIdAndDelete(id);

  return NextResponse.json({ success: true, id });
}
