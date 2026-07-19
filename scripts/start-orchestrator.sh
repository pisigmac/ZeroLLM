#!/bin/bash
cd "$(dirname "$0")/../python_backend"
echo "Starting FastAPI Orchestrator Backend..."
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
