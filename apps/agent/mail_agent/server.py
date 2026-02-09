"""FastAPI server for the mail agent with CopilotKit integration."""

import os
import warnings
from dotenv import load_dotenv
from fastapi import FastAPI
import uvicorn
from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

from mail_agent.agent import graph

load_dotenv()

app = FastAPI(title="AI Mail Agent")

add_langgraph_fastapi_endpoint(
    app=app,
    agent=LangGraphAGUIAgent(
        name="mail_agent",
        description="An AI mail assistant that helps users manage their Gmail inbox.",
        graph=graph,
    ),
    path="/",
)


def main():
    """Run the uvicorn server."""
    port = int(os.getenv("PORT", "8123"))
    uvicorn.run(
        "mail_agent.server:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )


warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")
if __name__ == "__main__":
    main()
