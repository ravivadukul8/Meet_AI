import { db } from "@/db";
import { agents, meetings } from "@/db/schema";
import { inngest } from "@/inngest/client";
import { streamVideo } from "@/lib/stream-video";
import {
  CallEndedEvent,
  CallRecordingReadyEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
  CallTranscriptionReadyEvent,
} from "@stream-io/node-sdk";
import { and, eq, not } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

function verifySignatureWithSDK(body: string, signature: string): boolean {
  return streamVideo.verifyWebhook(body, signature);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  const apiKey = req.headers.get("x-api-key");

  if (!signature || !apiKey) {
    return NextResponse.json(
      { error: "Missing signature or api key" },
      { status: 400 },
    );
  }

  const body = await req.text();

  if (!verifySignatureWithSDK(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // ✅ IMPORTANT: respond immediately (prevents timeout)
  const response = NextResponse.json({ status: "ok" });

  // 🔥 Background processing (DO NOT await)
  processWebhook(payload).catch((err) => {
    console.error("Webhook background error:", err);
  });

  return response;
}

async function processWebhook(payload: unknown) {
  const eventType = (payload as Record<string, unknown>)?.type;
  console.log("eventType:", eventType);

  try {
    // =========================
    // 1. CALL STARTED
    // =========================
    if (eventType === "call.session_started") {
      const event = payload as CallSessionStartedEvent;
      const meetingId = event.call.custom?.meetingId;

      if (!meetingId) return;

      const [existingMeeting] = await db
        .select()
        .from(meetings)
        .where(
          and(
            eq(meetings.id, meetingId),
            not(eq(meetings.status, "completed")),
            not(eq(meetings.status, "active")),
            not(eq(meetings.status, "cancelled")),
            not(eq(meetings.status, "processing")),
          ),
        );

      if (!existingMeeting) return;

      await db
        .update(meetings)
        .set({ status: "active", startedAt: new Date() })
        .where(eq(meetings.id, existingMeeting.id));

      const [existingAgent] = await db
        .select()
        .from(agents)
        .where(eq(agents.id, existingMeeting.agentId));

      if (!existingAgent) return;

      // 🔥 call your FastAPI server (agent)
      fetch("https://agent-issy.onrender.com/start-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callId: meetingId,
          agentUserId: existingAgent.id,
          instructions: existingAgent.instructions,
        }),
      }).catch(console.error);
    }

    // =========================
    // 2. PARTICIPANT LEFT
    // =========================
    else if (eventType === "call.session_participant_left") {
      const event = payload as CallSessionParticipantLeftEvent;
      const meetingId = event.call_cid.split(":")[1];

      if (!meetingId) return;

      const call = streamVideo.video.call("default", meetingId);
      await call.end();
    }

    // =========================
    // 3. SESSION ENDED
    // =========================
    else if (eventType === "call.session_ended") {
      const event = payload as CallEndedEvent;
      const meetingId = event.call.custom?.meetingId;

      if (!meetingId) return;

      await db
        .update(meetings)
        .set({ status: "processing", endedAt: new Date() })
        .where(and(eq(meetings.id, meetingId), eq(meetings.status, "active")));
    }

    // =========================
    // 4. TRANSCRIPTION READY
    // =========================
    else if (eventType === "call.transcription_ready") {
      const event = payload as CallTranscriptionReadyEvent;
      const meetingId = event.call_cid.split(":")[1];

      const [updatedMeeting] = await db
        .update(meetings)
        .set({ transcriptUrl: event.call_transcription.url })
        .where(eq(meetings.id, meetingId))
        .returning();

      if (!updatedMeeting) return;

      // 🔥 trigger inngest (background safe)
      inngest
        .send({
          name: "meetings/processing",
          data: {
            meetingId: updatedMeeting.id,
            transcriptUrl: updatedMeeting.transcriptUrl,
          },
        })
        .catch(console.error);
    }

    // =========================
    // 5. RECORDING READY
    // =========================
    else if (eventType === "call.recording_ready") {
      const event = payload as CallRecordingReadyEvent;
      const meetingId = event.call_cid.split(":")[1];

      await db
        .update(meetings)
        .set({ recordingUrl: event.call_recording.url })
        .where(eq(meetings.id, meetingId));
    }
  } catch (err) {
    console.error("Processing error:", err);
  }
}
