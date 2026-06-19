import { Request, Response, NextFunction } from 'express';
import { prisma } from '../libs/prisma.js';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const key = req.headers.authorization?.replace('Bearer ', '');

  if (!key) {
    res.status(401).json({ error: 'API key required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { apiKey: key } });

  if (!user) {
    res.status(401).json({ error: 'Invalid API key' });
    return;
  }

  if (Number(user.balance) <= 0) {
    res.status(402).json({ error: 'Insufficient balance' });
    return;
  }

  req.user = user;
  next();
}
