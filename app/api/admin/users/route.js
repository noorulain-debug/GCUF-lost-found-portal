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

export async function GET(req) {
  await connectDB();

  const auth = await requireAdmin(req);
  if (auth.error) return auth.error;

  const users = await User.find()
    .select("-password -__v")
    .sort({ createdAt: -1 })
    .lean();

  const itemCounts = await Item.aggregate([
    {
      $group: {
        _id: "$user",
        totalItems: { $sum: 1 },
        resolvedItems: {
          $sum: {
            $cond: [{ $eq: ["$type", "resolved"] }, 1, 0],
          },
        },
      },
    },
  ]);

  const countsMap = new Map(
    itemCounts.map((entry) => [String(entry._id), entry])
  );

  const enrichedUsers = users.map((user) => {
    const counts = countsMap.get(String(user._id));

    return {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      totalItems: counts?.totalItems || 0,
      resolvedItems: counts?.resolvedItems || 0,
    };
  });

  return NextResponse.json(enrichedUsers);
}
