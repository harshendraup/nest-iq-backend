import { Router } from 'express';
import authRoutes from './b2bUser.routes';


const router = Router();


import stitchRoutes from './stitch.routes.js'; // Ensure .js extension for ESM if needed, or just import based on config. I'll omit extension for TS.
import stitchRoutesNoExt from './stitch.routes';
import attendanceRoutes from './attendance.routes';

router.use('/b2b', authRoutes);
router.use('/stitch', stitchRoutesNoExt);
router.use('/attendance', attendanceRoutes);


router.get('/', (_req: any, res: { json: (arg0: { ok: boolean; message: string; }) => any; }) => res.json({ ok: true, message: 'nest-IQ  API server is running' }));


export default router;