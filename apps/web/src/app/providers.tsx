"use client";

import { SessionProvider } from "next-auth/react";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CopilotKit
        runtimeUrl="/api/copilotkit"
        agent="mail_agent"
      >
        {children}
      </CopilotKit>
    </SessionProvider>
  );
}
