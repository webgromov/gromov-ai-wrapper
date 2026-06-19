import { Router } from 'express';
import { llmHandler } from '../controllers/llm.controller';
import { validateLlmRequest } from '../middleware/validate';

const router = Router();

router.post('/chat', validateLlmRequest, llmHandler);

export default router;
