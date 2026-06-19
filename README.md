# gromov-ai-wrapper

REST API обёртка над LLM-провайдерами (Anthropic Claude, OpenAI GPT) через прокси-сервис [gptunnel.ru](https://gptunnel.ru). Единый endpoint для чата и стриминга, подсчёт токенов и стоимости, логирование запросов, база пользователей на PostgreSQL.

## Стек

- **Node.js + TypeScript** (ESM)
- **Express 5**
- **Prisma** (PostgreSQL)
- **Winston** — логирование

## Быстрый старт

### 1. Зависимости

```bash
npm install
```

### 2. Переменные окружения

Скопируй `.env.example` → `.env` и заполни:

```env
PORT=3000
GPTUNNEL_API_KEY=your_key_here
GPTUNNEL_BASE_URL=https://gptunnel.ru/v1
DATABASE_URL=postgresql://lightix:lightix.sql@localhost:5432/ai_wrapper
```

### 3. База данных

Подними PostgreSQL через Docker:

```bash
docker compose up -d
```

Примени миграции Prisma:

```bash
npx prisma migrate dev
```

### 4. Запуск

```bash
# dev-режим с hot reload
npm run dev

# production
npm run build
npm start
```

Сервер запустится на `http://localhost:3000`.

## API

### POST /api/llm/chat

Универсальный endpoint для обоих провайдеров. Провайдер определяется автоматически по имени модели: `claude-*` → Anthropic, остальное → OpenAI.

**Тело запроса:**

```json
{
  "model": "claude-sonnet-4-20250514",
  "messages": [
    { "role": "user", "content": "Привет!" }
  ],
  "max_tokens": 1024,
  "stream": false
}
```

**Ответ (без стриминга):**

```json
{
  "content": "Привет! Чем могу помочь?",
  "model": "claude-sonnet-4-20250514",
  "usage": {
    "inputTokens": 10,
    "outputTokens": 15,
    "totalTokens": 25
  },
  "costUSD": 0.000255
}
```

**Стриминг** (`"stream": true`) — ответ возвращается в формате SSE (`text/event-stream`).

### Поддерживаемые модели (с подсчётом стоимости)

| Модель | Input ($/1M) | Output ($/1M) |
|---|---|---|
| `claude-sonnet-4-20250514` | $3.00 | $15.00 |
| `gpt-5-mini` | $0.40 | $1.60 |

## Структура проекта

```
src/
├── server.ts               # точка входа
├── app.ts                  # Express app
├── controllers/
│   └── llm.controller.ts   # роутинг по провайдеру
├── services/
│   ├── anthropic.service.ts
│   ├── openai.service.ts
│   ├── token.service.ts
│   └── cost.service.ts
├── middleware/
│   └── validate.ts         # валидация входящего запроса
├── routes/
│   └── llm.routes.ts
├── types/
│   └── llm.types.ts
└── logger.ts               # Winston
prisma/
└── schema.prisma           # модель User с балансом
```