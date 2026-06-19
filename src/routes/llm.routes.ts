import { Router } from 'express';
import { llmHandler } from '../controllers/llm.controller';
import { validateLlmRequest } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/chat', authMiddleware, validateLlmRequest, llmHandler);

export default router;
