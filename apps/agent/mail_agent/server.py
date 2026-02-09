"""FastAPI server for the mail agent with CopilotKit integration."""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from copilotkit import LangGraphAGUIAgent
from ag_ui_langgraph import add_langgraph_fastapi_endpoint

from mail_agent.agent import graph

load_dotenv()

app = FastAPI(title="AI Mail Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = LangGraphAGUIAgent(
    name="mail_agent",
    description="An AI mail assistant that helps users manage their Gmail inbox. Can search, read, compose, send emails and control the mail UI.",
    graph=graph,
)

add_langgraph_fastapi_endpoint(app, agent, "/copilotkit")
