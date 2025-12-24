import { Router } from 'express';
import authRoutes from './auth.routes';


const router = Router();


import stitchRoutes from './stitch.routes.js'; // Ensure .js extension for ESM if needed, or just import based on config. I'll omit extension for TS.
import stitchRoutesNoExt from './stitch.routes';

router.use('/auth', authRoutes);
router.use('/stitch', stitchRoutesNoExt);


router.get('/', (_req: any, res: { json: (arg0: { ok: boolean; message: string; }) => any; }) => res.json({ ok: true, message: 'nest-IQ  API server is running' }));


export default router;