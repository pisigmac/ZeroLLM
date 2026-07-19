#!/usr/bin/env bash
set -e

echo -e "\033[1;36m==================================================\033[0m"
echo -e "\033[1;36m               ZeroLLM Installer                  \033[0m"
echo -e "\033[1;36m==================================================\033[0m"

INSTALL_DIR="$HOME/.zerollm"
REPO_URL="https://github.com/pisigmac/ZeroLLM.git"

# 1. Check Prerequisites
echo "Checking prerequisites..."
command -v git >/dev/null 2>&1 || { echo >&2 "git is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo >&2 "Node.js is required but not installed. Please install Node.js v18+. Aborting."; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo >&2 "pnpm is required but not installed. You can install it with: npm install -g pnpm. Aborting."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo >&2 "Python 3 is required for the backend. Aborting."; exit 1; }

# 2. Clone or Update the Repository
if [ -d "$INSTALL_DIR" ]; then
    echo -e "\n\033[1;33mZeroLLM is already installed at $INSTALL_DIR. Updating...\033[0m"
    cd "$INSTALL_DIR"
    git pull origin main
else
    echo -e "\n\033[1;32mCloning ZeroLLM to $INSTALL_DIR...\033[0m"
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 3. Setup Environment Variables
echo -e "\n\033[1;32mSetting up environment...\033[0m"
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "Created .env.local. You may want to add your API keys to this file later."
fi

# 4. Install Next.js dependencies
echo -e "\n\033[1;32mInstalling frontend dependencies (pnpm)...\033[0m"
pnpm install

# 5. Install Python backend dependencies
if [ -d "python_backend" ]; then
    echo -e "\n\033[1;32mSetting up Python backend...\033[0m"
    cd python_backend
    python3 -m venv venv
    source venv/bin/activate
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    elif [ -f "pyproject.toml" ]; then
        pip install -e .
    fi
    deactivate
    cd ..
fi

# 6. Create Global Alias / Binary Wrapper
echo -e "\n\033[1;32mCreating global command 'zerollm'...\033[0m"
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

cat << 'EOF' > "$BIN_DIR/zerollm"
#!/usr/bin/env bash
INSTALL_DIR="$HOME/.zerollm"

if [ "$1" == "start" ]; then
    echo "Starting ZeroLLM..."
    cd "$INSTALL_DIR"
    pnpm dev:all
elif [ "$1" == "update" ]; then
    echo "Updating ZeroLLM..."
    cd "$INSTALL_DIR"
    git pull origin main
    pnpm install
else
    echo "Usage: zerollm [start|update]"
    echo "  start   - Starts the ZeroLLM local dashboard"
    echo "  update  - Pulls the latest code and installs dependencies"
fi
EOF

chmod +x "$BIN_DIR/zerollm"

# Ensure ~/.local/bin is in PATH
if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
    echo -e "\n\033[1;33mWARNING: $BIN_DIR is not in your PATH.\033[0m"
    echo "Please add the following line to your ~/.bashrc or ~/.zshrc:"
    echo "export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

echo -e "\n\033[1;32m==================================================\033[0m"
echo -e "\033[1;32m      ZeroLLM installed successfully!             \033[0m"
echo -e "\033[1;32m==================================================\033[0m"
echo -e "You can now run ZeroLLM from anywhere using the command:"
echo -e "  \033[1;36mzerollm start\033[0m\n"
