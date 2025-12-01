import { Router } from 'express';
import authRoutes from './auth.routes';


const router = Router();


router.use('/auth', authRoutes);


router.get('/', (_req: any, res: { json: (arg0: { ok: boolean; message: string; }) => any; }) => res.json({ ok: true, message: 'nest-IQ  API server is running' }));


export default router;