#!/usr/bin/env bash
# setup.sh — One-command setup for HK FraudGuard
# Usage: bash setup.sh
set -e

echo "🛡️  HK FraudGuard — Setup"
echo "========================="

# 1. Create .env if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ Created .env from .env.example"
  echo "⚠️  Edit .env and set DASHSCOPE_API_KEY before running the backend."
else
  echo "✅ .env already exists"
fi

# 2. Backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
python3 -m venv venv 2>/dev/null || python -m venv venv
# shellcheck disable=SC1091
source venv/bin/activate
pip install -q -r requirements.txt
cd ..
echo "✅ Backend ready"

# 3. Frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..
echo "✅ Frontend ready"

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env and set DASHSCOPE_API_KEY"
echo "  2. Build the RAG database:  cd rag-pipeline && jupyter notebook  (run main.ipynb)"
echo "  3. Start backend:           cd backend && source venv/bin/activate && python app.py"
echo "  4. Start frontend:          cd frontend && npm run dev"
echo "  5. Open http://localhost:5173"
