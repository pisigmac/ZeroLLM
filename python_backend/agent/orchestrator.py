import os
import asyncio
from typing import TypedDict, Annotated, Sequence, Dict, Any, List
from langchain_core.messages import BaseMessage, HumanMessage, ToolMessage, AIMessage
from langchain_core.tools import StructuredTool
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from langchain_openai import ChatOpenAI
from mcp.client.stdio import stdio_client, StdioServerParameters
from mcp.client.session import ClientSession
import json

class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], "add"]

# Global references
mcp_session: ClientSession = None
mcp_exit_stack = None
app_graph = None

async def init_mcp():
    global mcp_session, mcp_exit_stack, app_graph
    from contextlib import AsyncExitStack
    mcp_exit_stack = AsyncExitStack()
    
    server_params = StdioServerParameters(
        command="npx",
        args=["-y", "@modelcontextprotocol/server-filesystem", "/home/oh20210736-ud/Documents/Kimi_projects/free_model"],
        env={"PATH": os.getenv("PATH", "")}
    )
    
    read, write = await mcp_exit_stack.enter_async_context(stdio_client(server_params))
    mcp_session = await mcp_exit_stack.enter_async_context(ClientSession(read, write))
    await mcp_session.initialize()
    
    # Fetch tools from MCP
    response = await mcp_session.list_tools()

    llm = ChatOpenAI(
        model="meta-llama/llama-3.3-70b-instruct:free",
        api_key=os.getenv("OPENROUTER_API_KEY", "dummy"),
        base_url="https://openrouter.ai/api/v1"
    )
    
    # For openrouter/llama-3.3, tool calling requires careful schema formatting
    # Instead of StructuredTool, we format tools manually for bind_tools if needed.
    # We will use bind_tools with the raw JSON schema from MCP.
    
    # Build raw openai tools list
    openai_tools = []
    for tool_info in response.tools:
        openai_tools.append({
            "type": "function",
            "function": {
                "name": tool_info.name,
                "description": tool_info.description or "",
                "parameters": tool_info.inputSchema
            }
        })
        
    llm_with_tools = llm.bind_tools(openai_tools)
    
    def call_model(state: AgentState):
        messages = state["messages"]
        response = llm_with_tools.invoke(messages)
        return {"messages": [response]}
        
    async def call_tool_node(state: AgentState):
        last_message = state["messages"][-1]
        tool_responses = []
        for tool_call in last_message.tool_calls:
            name = tool_call["name"]
            args = tool_call["args"]
            try:
                res = await mcp_session.call_tool(name, arguments=args)
                text = "\n".join([c.text for c in res.content if hasattr(c, 'text')])
            except Exception as e:
                text = f"Error: {str(e)}"
            tool_responses.append(ToolMessage(content=text, tool_call_id=tool_call["id"]))
        return {"messages": tool_responses}

    def should_continue(state: AgentState):
        last_message = state["messages"][-1]
        if hasattr(last_message, "tool_calls") and last_message.tool_calls:
            return "tools"
        return END

    workflow = StateGraph(AgentState)
    workflow.add_node("agent", call_model)
    workflow.add_node("tools", call_tool_node)
    
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    workflow.add_edge("tools", "agent")

    app_graph = workflow.compile()

async def cleanup_mcp():
    global mcp_exit_stack
    if mcp_exit_stack:
        await mcp_exit_stack.aclose()

async def run_agent(user_message: str) -> str:
    if not app_graph:
        return "MCP Orchestrator is still initializing..."
        
    inputs = {"messages": [HumanMessage(content=user_message)]}
    result = await app_graph.ainvoke(inputs)
    return result["messages"][-1].content
