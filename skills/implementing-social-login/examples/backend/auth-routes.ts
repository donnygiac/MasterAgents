/**
 * Rotte auth (esempio Express). Composizione delle dipendenze:
 * qui si sceglie l'adapter di persistenza deciso in fase di analisi.
 */
import { Router } from 'express';
import { createAuthService } from './auth-service';
import { createAuthController } from './auth-controller';

// Scegli UN adapter in base alla matrice decisionale:
import { prismaUserStore } from './user-store.prisma';      // progetti con Prisma
// import { statelessUserStore } from './user-store.stateless'; // progetti senza DB

export const authService = createAuthService(prismaUserStore);
const controller = createAuthController(authService);

const router = Router();

router.post('/google', controller.googleAuth); // pubblica: è il login
router.get('/me', controller.getMe);           // richiede sessione (401 altrimenti)
router.post('/logout', controller.logout);

export default router;
