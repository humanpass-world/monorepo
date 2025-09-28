import { fromHono } from 'chanfana';
import { Hono } from 'hono';
import type { ContextType } from 'workers/types';
import { MiniappVerifiedWalletDisconnect } from './disconnect';
import { MiniappVerifiedWalletGetRequest } from './get-request';
import { MiniappVerifiedWalletList } from './list';

const walletRoutes = fromHono(new Hono<ContextType>());

walletRoutes.get('/list', MiniappVerifiedWalletList);
walletRoutes.delete('/disconnect', MiniappVerifiedWalletDisconnect);
walletRoutes.get('/:requestId', MiniappVerifiedWalletGetRequest);

export default walletRoutes;
