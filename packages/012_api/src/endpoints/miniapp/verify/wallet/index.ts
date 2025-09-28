import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import { MiniappVerifyWalletGetRequest } from './get-request';
import { MiniappVerifyWalletProof } from './proof';

const walletRoutes = fromHono(new Hono<ContextType>());

walletRoutes.get('/request', MiniappVerifyWalletGetRequest);
walletRoutes.post('/proof', MiniappVerifyWalletProof);

export default walletRoutes;
