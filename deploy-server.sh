#!/bin/bash

echo "========================================"
echo "   Clinic Application Server Deployment"
echo "========================================"

echo ""
echo "[1/4] Stopping any running instances..."
pkill -f "next start" 2>/dev/null || true

echo ""
echo "[2/4] Installing dependencies..."
pnpm install

echo ""
echo "[3/4] Building production version..."
pnpm build

echo ""
echo "[4/4] Starting server for network access..."
echo ""
echo "✅ Application is now running on:"
echo "   Local:  http://localhost:3000"
echo "   Network: http://$(hostname -I | awk '{print $1}'):3000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

pnpm start:network
