"""LangGraph agent definition for the mail agent."""

from datetime import datetime
from typing import List

from copilotkit import CopilotKitState
from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import StateGraph
from langgraph.prebuilt import ToolNode
from langgraph.types import Command
from typing_extensions import Literal


class AgentState(CopilotKitState):
    """Agent state inheriting from CopilotKitState for frontend tool injection."""
    pass


def build_system_prompt() -> str:
    today = datetime.now().strftime("%Y-%m-%d")
    return f"""You are an AI mail assistant. You MUST use tools to control the mail UI. Never just describe actions — execute them.

TODAY: {today}

TOOL USAGE (always call the right tool):
- FILTER/SHOW/SEARCH emails → call setFilters
- OPEN/READ a specific email → call openEmail(searchTerm="keyword")
- SUMMARIZE an email → call openEmail first, then write a summary in chat
- SEND an email → call fillComposeForm FIRST to show the draft, then ASK the user to confirm in chat (e.g. "Here's the draft. Shall I send it?"). Only call sendEmail AFTER the user confirms (says "yes", "send it", "go ahead", etc.).
- EDIT/REWRITE draft → call updateDraft(body="new text")
- REPLY/DRAFT A REPLY → call replyToEmail(body="your reply text")
- FORWARD → call fillComposeForm(to="", subject="Fwd: ...", body="forwarded content")
- NAVIGATE → call navigateTo

CRITICAL RULES:
1. "open the X one" → IMMEDIATELY call openEmail(searchTerm="X").
2. "draft a reply" / "reply" → IMMEDIATELY call replyToEmail(body="your reply").
3. "send an email to X" → call fillComposeForm FIRST, then STOP and ask for confirmation. Do NOT call sendEmail until the user confirms.
4. When user says "yes" / "send it" / "go ahead" after seeing a draft → call sendEmail.
5. For dates, compute from today ({today}). Use YYYY-MM-DD format.
6. For replies, write a thoughtful response. Do NOT copy the original email body.
7. Always use tools to update the UI. You are a UI copilot, not a chatbot.
"""


def should_route_to_tool_node(tool_calls, fe_tools):
    """Returns True if none of the tool calls are frontend tools."""
    if not tool_calls:
        return False
    fe_tool_names = {tool.get("name") for tool in fe_tools}
    for tool_call in tool_calls:
        tool_name = (
            tool_call.get("name")
            if isinstance(tool_call, dict)
            else getattr(tool_call, "name", None)
        )
        if tool_name in fe_tool_names:
            return False
    return True


# Backend tools (none currently — all tools are frontend actions)
tools: list = []


async def chat_node(
    state: AgentState, config: RunnableConfig
) -> Command[Literal["tool_node", "__end__"]]:
    """ReAct chat node that binds frontend + backend tools to the model."""

    model = ChatOpenAI(model="gpt-4.1")

    # Get frontend tools injected by CopilotKit via AG-UI protocol
    fe_tools = state.get("copilotkit", {}).get("actions", [])
    model_with_tools = model.bind_tools([*fe_tools, *tools])

    system_message = SystemMessage(content=build_system_prompt())

    response = await model_with_tools.ainvoke(
        [system_message, *state["messages"]],
        config,
    )

    tool_calls = response.tool_calls
    if tool_calls and should_route_to_tool_node(tool_calls, fe_tools):
        return Command(goto="tool_node", update={"messages": response})

    return Command(goto="__end__", update={"messages": response})


# Build the workflow graph
workflow = StateGraph(AgentState)
workflow.add_node("chat_node", chat_node)
workflow.add_node("tool_node", ToolNode(tools=tools))
workflow.add_edge("tool_node", "chat_node")
workflow.set_entry_point("chat_node")

checkpointer = InMemorySaver()
graph = workflow.compile(checkpointer=checkpointer)
