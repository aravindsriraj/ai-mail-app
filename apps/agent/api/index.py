"""Vercel serverless entrypoint for the FastAPI agent."""

import sys
import os
import warnings

# Add parent directory to path so mail_agent package is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

warnings.filterwarnings("ignore", category=UserWarning, module="pydantic")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

from mail_agent.agent import graph

app = FastAPI(title="AI Mail Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

add_langgraph_fastapi_endpoint(
    app=app,
    agent=LangGraphAGUIAgent(
        name="mail_agent",
        description="An AI mail assistant that helps users manage their Gmail inbox.",
        graph=graph,
    ),
    path="/api",
)
