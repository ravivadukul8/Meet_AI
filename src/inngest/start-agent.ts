import { inngest } from "@/inngest/client";

export const startAgentFunction = inngest.createFunction(
  {
    id: "start-agent",
    retries: 3,
  },
  { event: "agent/start" },
  async ({ event }) => {
    const { callId, agentUserId, instructions } = event.data;

    console.log("🚀 Inngest running agent:", callId);

    const res = await fetch("https://agent-issy.onrender.com/run-agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        callId,
        agentUserId,
        instructions,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to run agent");
    }

    return { success: true };
  },
);
