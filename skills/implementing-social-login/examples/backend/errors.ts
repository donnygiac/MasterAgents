/**
 * Gerarchia errori minima + error handler Express.
 *
 * Se il progetto ospite ha GIÀ una gestione errori (classi, handler, logger):
 * usa quella e limita l'integrazione a errori 401/403 semanticamente corretti.
 * Questo file serve solo ai progetti che non hanno nulla.
 */
import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 500,
        public readonly code: string = 'INTERNAL_ERROR'
    ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401, 'UNAUTHORIZED');
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN');
    }
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({ status: 'error', code: err.code, message: err.message });
    }
    console.error('Unexpected error:', err);
    return res.status(500).json({
        status: 'error',
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Errore inatteso',
    });
};
