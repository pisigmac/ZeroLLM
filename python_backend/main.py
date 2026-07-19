from contextlib import asynccontextmanager
from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
import os

# Load environment variables from the parent Next.js project root
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from agent.orchestrator import run_agent, init_mcp, cleanup_mcp

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize the MCP connection to the local filesystem server
    await init_mcp()
    yield
    # Cleanup MCP connection on shutdown
    await cleanup_mcp()

app = FastAPI(title="Config Assistant Orchestrator", lifespan=lifespan)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Pass user message to LangGraph
    response_text = await run_agent(request.message)
    return ChatResponse(response=response_text)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
