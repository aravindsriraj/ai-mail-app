"""Agent state definition for the mail agent."""

from typing import TypedDict, Optional, Literal
from langchain_core.messages import BaseMessage
from langgraph.graph import MessagesState


class EmailSummary(TypedDict):
    id: str
    thread_id: str
    sender: str
    subject: str
    snippet: str
    date: str
    is_read: bool
    labels: list[str]


class EmailDetail(TypedDict):
    id: str
    thread_id: str
    sender: str
    to: str
    subject: str
    body: str
    date: str
    is_read: bool
    labels: list[str]


class ComposeData(TypedDict, total=False):
    to: str
    subject: str
    body: str
    in_reply_to: Optional[str]


class MailAgentState(MessagesState):
    """State for the mail agent, extends MessagesState for CopilotKit compatibility."""
    emails: list[EmailSummary]
    current_email: Optional[EmailDetail]
    compose_data: Optional[ComposeData]
    current_view: str  # "inbox", "sent", "compose", "detail"
    filters: dict
