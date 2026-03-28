import { StreamClient } from "@stream-io/node-sdk";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "user-" + Date.now();

  const streamClient = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_VIDEO_API_KEY!,
    process.env.STREAM_VIDEO_SECRET_KEY!,
  );

  // Create/upsert the user
  await streamClient.upsertUsers([{ id: userId, name: "You", role: "user" }]);

  // Generate token
  const token = streamClient.generateUserToken({ user_id: userId });

  return NextResponse.json({ token, userId });
}
