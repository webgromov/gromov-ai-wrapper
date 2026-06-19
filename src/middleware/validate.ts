import { Request, Response, NextFunction } from 'express';

export function validateLlmRequest(req: Request, res: Response, next: NextFunction): void {
  const { model, messages } = req.body;

  if (!model || typeof model !== 'string') {
    res.status(400).json({ error: 'Field "model" is required and must be a string' });
    return;
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Field "messages" is required and must be a non-empty array' });
    return;
  }

  next();
}
