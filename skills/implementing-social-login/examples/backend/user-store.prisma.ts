/**
 * Adapter UserStore per progetti con Prisma.
 *
 * Modello minimo richiesto (da PROPORRE all'utente come modifica allo schema,
 * mai eseguire `prisma migrate` in automatico):
 *
 *   model User {
 *     id        BigInt   @id @default(autoincrement())
 *     email     String   @unique
 *     googleId  String?  @unique @map("google_id")
 *     name      String
 *     role      String   @default("USER")   // o un enum se il progetto li usa
 *     createdAt DateTime @default(now()) @map("created_at")
 *     updatedAt DateTime @default(now()) @updatedAt @map("updated_at")
 *
 *     @@map("users")
 *   }
 *
 * Se il progetto ha già una tabella utenti: estendila (google_id nullable
 * univoco se manca) invece di crearne una seconda, e adatta il mapping qui.
 */
import { PrismaClient } from '@prisma/client';
import type { UserStore, AuthUser } from './auth-service';

const prisma = new PrismaClient(); // riusa l'istanza condivisa del progetto se esiste

function toAuthUser(u: { id: bigint | number | string; email: string; name: string; role: string; googleId: string | null }): AuthUser {
    return {
        id: u.id.toString(),
        email: u.email,
        name: u.name,
        role: u.role,
        googleId: u.googleId,
    };
}

export const prismaUserStore: UserStore = {
    async findByEmail(email) {
        const user = await prisma.user.findUnique({ where: { email } });
        return user ? toAuthUser(user) : null;
    },

    async create(data) {
        const user = await prisma.user.create({ data });
        return toAuthUser(user);
    },

    async linkGoogleId(email, googleId) {
        const user = await prisma.user.update({ where: { email }, data: { googleId } });
        return toAuthUser(user);
    },
};
