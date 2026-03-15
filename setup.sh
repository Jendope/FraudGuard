#!/usr/bin/env bash
# setup.sh — One-command setup for HK FraudGuard
# Usage: bash setup.sh
set -e

echo "🛡️  HK FraudGuard — Setup"
echo "========================="

# 1. Create root .env if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example"
  echo "⚠️  Edit .env and set DASHSCOPE_API_KEY and BIGMODEL_API_KEY before running."
else
  echo "✅ .env already exists"
fi

# 2. Create FrauGuard .env by copying root .env
if [ ! -f FrauGuard/.env ]; then
  cp .env FrauGuard/.env
  echo "✅ Created FrauGuard/.env from root .env"
else
  echo "✅ FrauGuard/.env already exists"
fi

# 3. Backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
python3 -m venv venv 2>/dev/null || python -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install -q -r requirements.txt
cd ..
echo "✅ Backend ready"

# 4. Web interface dependencies
echo ""
echo "📦 Installing web interface dependencies..."
cd FrauGuard
npm install --silent
cd ..
echo "✅ Web interface ready"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and set DASHSCOPE_API_KEY and BIGMODEL_API_KEY"
echo "  2. Copy updated keys to FrauGuard:  cp .env FrauGuard/.env"
echo "  3. Start backend:           cd backend && source venv/bin/activate && python app.py"
echo "  4. Start web interface:     cd FrauGuard && npm run dev"
echo "  5. Open http://localhost:3000"
echo ""
echo "Note: The RAG vector store will be built automatically on first request"
echo "      from hk01_scam_articles.md in the backend directory."
