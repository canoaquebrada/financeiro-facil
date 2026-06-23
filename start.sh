#!/usr/bin/env bash
# start.sh — Inicializa o banco SQLite (runtime) e sobe o Next.js
#
# O disco persistente do Render só está disponível EM TEMPO DE EXECUÇÃO,
# não durante o build. Por isso o prisma db push roda aqui, no start.

set -e

echo "▶️  Aplicando schema do Prisma no banco SQLite..."
npx prisma db push --accept-data-loss --skip-generate

echo "✅ Schema aplicado. Iniciando Next.js..."
exec npm start
