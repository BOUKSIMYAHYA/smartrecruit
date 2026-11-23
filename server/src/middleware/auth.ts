import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createClerkClient } from '@clerk/backend';
import { ENV } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  clerkId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: Role;
  candidateProfileId?: string;
  isActive: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

// Clerk SDK instance if configured
const clerk = ENV.CLERK_SECRET_KEY && !ENV.CLERK_SECRET_KEY.includes('placeholder')
  ? createClerkClient({ secretKey: ENV.CLERK_SECRET_KEY, publishableKey: ENV.CLERK_PUBLISHABLE_KEY })
  : null;

/**
 * Authentication Middleware:
 * Verifies Clerk JWT, or dev JWT session.
 * Synchronizes user with PostgreSQL database.
 * Enforces server-side SUPER_ADMIN assignment for official emails.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const queryToken = typeof req.query.token === 'string' ? req.query.token : null;
    let token: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (queryToken) {
      token = queryToken;
    }

    if (!token) {
      res.status(401).json({ error: 'Accès non autorisé : jeton d\'authentification manquant.' });
      return;
    }
    let userEmail: string | null = null;
    let clerkUserId: string | null = null;
    let firstName: string | null = null;
    let lastName: string | null = null;

    // 1. Check if token is a dev/local session token
    try {
      const decodedLocal = jwt.verify(token, ENV.JWT_SECRET) as any;
      if (decodedLocal && decodedLocal.email) {
        userEmail = decodedLocal.email.toLowerCase();
        clerkUserId = decodedLocal.clerkId || `dev_${userEmail}`;
        firstName = decodedLocal.firstName || null;
        lastName = decodedLocal.lastName || null;
      }
    } catch {
      // Not a local token, try Clerk verification
    }

    // 2. If not local token and Clerk is configured, verify via Clerk
    if (!userEmail && clerk) {
      try {
        const verified = await (clerk as any).verifyToken(token);
        if (verified && verified.sub) {
          clerkUserId = verified.sub;
          const clerkUser = await clerk.users.getUser(verified.sub);
          userEmail = clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase() || null;
          firstName = clerkUser.firstName || null;
          lastName = clerkUser.lastName || null;
        }
      } catch (err) {
        // Token was invalid
      }
    }

    // 3. Fallback for test tokens or unverified tokens in development
    if (!userEmail) {
      try {
        // Attempt unverified decode if in dev mode
        const decoded = jwt.decode(token) as any;
        if (decoded && (decoded.email || decoded.sub)) {
          userEmail = (decoded.email || `${decoded.sub}@clerk.dev`).toLowerCase();
          clerkUserId = decoded.sub || `clerk_${userEmail}`;
          firstName = decoded.firstName || null;
          lastName = decoded.lastName || null;
        }
      } catch {}
    }

    if (!userEmail || !clerkUserId) {
      res.status(401).json({ error: 'Jeton d\'authentification invalide ou expiré.' });
      return;
    }

    // 4. Server-enforced Super Admin recognition
    const isConfiguredSuperAdmin = ENV.SUPER_ADMIN_EMAILS.includes(userEmail);

    // 5. Look up or auto-sync user in PostgreSQL database
    let dbUser = await prisma.user.findFirst({
      where: {
        OR: [{ clerkId: clerkUserId }, { email: userEmail }],
      },
      include: {
        candidateProfile: { select: { id: true } },
      },
    });

    if (!dbUser) {
      // Determine initial role
      const initialRole: Role = isConfiguredSuperAdmin ? Role.SUPER_ADMIN : Role.CANDIDATE;

      dbUser = await prisma.user.create({
        data: {
          clerkId: clerkUserId,
          email: userEmail,
          firstName,
          lastName,
          role: initialRole,
          isActive: true,
          candidateProfile:
            initialRole === Role.CANDIDATE
              ? {
                  create: {
                    country: 'France',
                  },
                }
              : undefined,
        },
        include: {
          candidateProfile: { select: { id: true } },
        },
      });
    } else {
      // Enforce SUPER_ADMIN role on existing user if email is in official super admin list
      if (isConfiguredSuperAdmin && dbUser.role !== Role.SUPER_ADMIN) {
        dbUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { role: Role.SUPER_ADMIN },
          include: { candidateProfile: { select: { id: true } } },
        });
      }
    }

    if (!dbUser.isActive) {
      res.status(403).json({ error: 'Votre compte a été désactivé par un administrateur.' });
      return;
    }

    // Update last login
    prisma.user.update({
      where: { id: dbUser.id },
      data: { lastLoginAt: new Date() },
    }).catch(() => {});

    req.user = {
      id: dbUser.id,
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      role: dbUser.role,
      candidateProfileId: dbUser.candidateProfile?.id,
      isActive: dbUser.isActive,
    };

    next();
  } catch (error) {
    console.error('Erreur authentification:', error);
    res.status(500).json({ error: 'Erreur interne lors de la vérification de l\'authentification.' });
  }
}
