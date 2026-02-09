import {
  CopilotRuntime,
  ExperimentalEmptyAdapter,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { LangGraphAgent } from "@copilotkit/runtime/langgraph";
import { NextRequest } from "next/server";

const mailAgent = new LangGraphAgent({
  deploymentUrl:
    process.env.LANGGRAPH_DEPLOYMENT_URL || "http://127.0.0.1:8123",
  graphId: "mail_agent",
  langsmithApiKey: process.env.LANGSMITH_API_KEY || "",
});

const runtime = new CopilotRuntime({
  agents: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mail_agent: mailAgent as any,
  },
});

export const POST = async (req: NextRequest) => {
  console.log("[CopilotKit] POST request received");
  try {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
      runtime,
      serviceAdapter: new ExperimentalEmptyAdapter(),
      endpoint: "/api/copilotkit",
    });

    const response = await handleRequest(req);
    console.log("[CopilotKit] Response status:", response.status);
    if (response.status >= 400) {
      const cloned = response.clone();
      try {
        const body = await cloned.text();
        console.error("[CopilotKit] Error response body:", body.substring(0, 500));
      } catch { /* ignore */ }
    }
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Agent error";
    const stack = error instanceof Error ? error.stack : "";
    console.error("[CopilotKit] Error running agent:", message, stack);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
