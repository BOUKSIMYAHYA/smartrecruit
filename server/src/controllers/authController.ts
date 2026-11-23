import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma.js';
import { ENV } from '../config/env.js';
import { Role } from '@prisma/client';
import { AuditService } from '../middleware/audit.js';
import { EmailService } from '../services/emailService.js';

export class AuthController {
  /**
   * Get current authenticated user profile and roles
   */
  public static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Non authentifié.' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
          candidateProfile: {
            include: {
              skills: { include: { skill: true } },
              resumes: { orderBy: { createdAt: 'desc' } },
              coverLetters: { orderBy: { createdAt: 'desc' } },
            },
          },
          assignedJobs: {
            include: { job: { select: { id: true, title: true, reference: true } } },
          },
        },
      });

      if (!user) {
        res.status(404).json({ error: 'Utilisateur introuvable.' });
        return;
      }

      res.json({
        user: {
          id: user.id,
          clerkId: user.clerkId,
          email: user.email,
          phone: user.phone,
          firstName: user.firstName,
          lastName: user.lastName,
          avatarUrl: user.avatarUrl,
          role: user.role,
          isActive: user.isActive,
          isVerified: user.isVerified,
          candidateProfile: user.candidateProfile,
          assignedJobs: user.assignedJobs,
        },
      });
    } catch (error) {
      console.error('Erreur getMe:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
    }
  }

  /**
   * Standard secure login: supports Email or Phone + Password
   * Includes specific credentials requested:
   * - yhykk8899@gmail.com / yhykk8899
   * - saadtoufik67@gmail.com / dimawydad
   */
  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, identifier, password } = req.body;
      const loginId = (email || identifier || '').trim().toLowerCase();

      if (!loginId || !password) {
        res.status(400).json({ error: 'Veuillez saisir votre identifiant (e-mail ou téléphone) et votre mot de passe.' });
        return;
      }

      // 1. Direct check for the two designated immutable Super Admins
      if (loginId === 'yhykk8899@gmail.com' && password === 'yhykk8899') {
        const user = await AuthController.ensureSuperAdmin('yhykk8899@gmail.com', 'Yahya', 'Admin', 'yhykk8899');
        const token = AuthController.generateToken(user);
        await AuditService.log(null, 'SUPER_ADMIN_LOGIN', 'User', user.id, { email: user.email });
        res.json({ token, user: AuthController.formatUserResponse(user) });
        return;
      }

      if (loginId === 'saadtoufik67@gmail.com' && password === 'dimawydad') {
        const user = await AuthController.ensureSuperAdmin('saadtoufik67@gmail.com', 'Saad', 'Toufik', 'dimawydad');
        const token = AuthController.generateToken(user);
        await AuditService.log(null, 'SUPER_ADMIN_LOGIN', 'User', user.id, { email: user.email });
        res.json({ token, user: AuthController.formatUserResponse(user) });
        return;
      }

      // 2. Find user by email OR by phone
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: loginId },
            { phone: loginId },
            { candidateProfile: { phone: loginId } },
          ],
        },
        include: { candidateProfile: true },
      });

      if (!user) {
        res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
        return;
      }

      // Check password
      let isMatch = false;
      if (user.passwordHash) {
        isMatch = await bcrypt.compare(password, user.passwordHash);
      } else if (password === 'candidate123' || password === 'admin123') {
        // Fallback demo password for seeded users
        isMatch = true;
      }

      if (!isMatch) {
        res.status(401).json({ error: 'Mot de passe incorrect.' });
        return;
      }

      // Check email verification for candidates
      if (user.role === Role.CANDIDATE && user.isVerified === false) {
        // Send a fresh verification code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: { verificationCode: code, verificationExpiresAt: expiresAt },
        });

        // Send in background non-blocking
        EmailService.sendVerificationCode(user.email, user.firstName || 'Candidat', code).catch((err) => {
          console.warn('[Auth] Background email send error:', err?.message);
        });

        res.status(403).json({
          needsVerification: true,
          email: user.email,
          message: 'Votre compte n\'est pas encore vérifié. Un code à 6 chiffres a été envoyé à votre adresse e-mail.',
          devCode: code,
        });
        return;
      }

      // Update lastLoginAt
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      const token = AuthController.generateToken(user);
      await AuditService.log(null, 'USER_LOGIN', 'User', user.id, { email: user.email, role: user.role });

      res.json({ token, user: AuthController.formatUserResponse(user) });
    } catch (error) {
      console.error('Erreur login:', error);
      res.status(500).json({ error: 'Erreur technique lors de la connexion.' });
    }
  }

  /**
   * Candidate Registration with Email, Password & Phone
   * Automatically generates and emails a 6-digit OTP code for verification
   */
  public static async registerCandidate(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, phone, firstName, lastName } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'L\'adresse e-mail et le mot de passe sont obligatoires.' });
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const phoneClean = phone ? phone.trim() : null;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: emailLower },
      });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      const passwordHash = await bcrypt.hash(password, 10);

      let candidateUser;

      if (existingUser) {
        if (existingUser.isVerified) {
          res.status(400).json({ error: 'Un compte avec cette adresse e-mail existe déjà. Veuillez vous connecter.' });
          return;
        }

        // Update unverified user with new password & new code
        candidateUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash,
            phone: phoneClean || existingUser.phone,
            firstName: firstName || existingUser.firstName,
            lastName: lastName || existingUser.lastName,
            verificationCode: code,
            verificationExpiresAt: expiresAt,
          },
          include: { candidateProfile: true },
        });
      } else {
        // Create new unverified candidate
        candidateUser = await prisma.user.create({
          data: {
            email: emailLower,
            clerkId: `local_${emailLower.replace(/[^a-zA-Z0-9]/g, '_')}`,
            passwordHash,
            phone: phoneClean,
            firstName: firstName?.trim() || emailLower.split('@')[0],
            lastName: lastName?.trim() || '',
            role: Role.CANDIDATE,
            isVerified: false,
            verificationCode: code,
            verificationExpiresAt: expiresAt,
            candidateProfile: {
              create: {
                phone: phoneClean,
                country: 'France',
                yearsOfExp: 0,
              },
            },
          },
          include: { candidateProfile: true },
        });
      }

      // Send verification code by email in background (never blocks the HTTP response)
      const candidateDisplayName = `${candidateUser.firstName || ''} ${candidateUser.lastName || ''}`.trim() || 'Candidat';
      EmailService.sendVerificationCode(emailLower, candidateDisplayName, code).catch((err) => {
        console.warn('[Auth] Background email send error:', err?.message);
      });

      await AuditService.log(null, 'CANDIDATE_REGISTERED', 'User', candidateUser.id, {
        email: emailLower,
        phone: phoneClean,
      });

      res.status(201).json({
        success: true,
        email: emailLower,
        message: 'Votre compte a été créé ! Un code de vérification à 6 chiffres a été envoyé à votre adresse e-mail.',
        devCode: code, // Convenient for local testing
      });
    } catch (error) {
      console.error('Erreur registerCandidate:', error);
      res.status(500).json({ error: 'Erreur lors de la création du compte candidat.' });
    }
  }

  /**
   * Verify email with 6-digit OTP code and automatically log in
   */
  public static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({ error: 'L\'adresse e-mail et le code de vérification sont requis.' });
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const codeClean = code.trim();

      const user = await prisma.user.findUnique({
        where: { email: emailLower },
        include: { candidateProfile: true },
      });

      if (!user) {
        res.status(404).json({ error: 'Utilisateur introuvable.' });
        return;
      }

      if (user.isVerified) {
        const token = AuthController.generateToken(user);
        res.json({
          message: 'Compte déjà vérifié.',
          token,
          user: AuthController.formatUserResponse(user),
        });
        return;
      }

      if (!user.verificationCode || user.verificationCode !== codeClean) {
        res.status(400).json({ error: 'Code de vérification invalide.' });
        return;
      }

      if (user.verificationExpiresAt && user.verificationExpiresAt < new Date()) {
        res.status(400).json({ error: 'Ce code de vérification a expiré. Veuillez en demander un nouveau.' });
        return;
      }

      // Mark verified
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationCode: null,
          verificationExpiresAt: null,
          lastLoginAt: new Date(),
        },
        include: { candidateProfile: true },
      });

      const token = AuthController.generateToken(updatedUser);
      await AuditService.log(null, 'EMAIL_VERIFIED', 'User', updatedUser.id, { email: updatedUser.email });

      res.json({
        success: true,
        message: 'Compte vérifié avec succès ! Bienvenue sur SmartRecruit ATS.',
        token,
        user: AuthController.formatUserResponse(updatedUser),
      });
    } catch (error) {
      console.error('Erreur verifyEmail:', error);
      res.status(500).json({ error: 'Erreur lors de la vérification du code.' });
    }
  }

  /**
   * Resend verification code
   */
  public static async resendCode(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: 'L\'adresse e-mail est requise.' });
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const user = await prisma.user.findUnique({ where: { email: emailLower } });

      if (!user) {
        res.status(404).json({ error: 'Compte introuvable.' });
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { verificationCode: code, verificationExpiresAt: expiresAt },
      });

      // Send in background non-blocking
      EmailService.sendVerificationCode(emailLower, user.firstName || 'Candidat', code).catch((err) => {
        console.warn('[Auth] Background email send error:', err?.message);
      });

      res.json({
        success: true,
        message: 'Un nouveau code de vérification a été envoyé à votre adresse e-mail.',
        devCode: code,
      });
    } catch (error) {
      console.error('Erreur resendCode:', error);
      res.status(500).json({ error: 'Erreur lors de l\'envoi du code.' });
    }
  }

  /**
   * Dev / Demo login helper: provides instant JWT tokens for the required roles and super admins
   */
  public static async devLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, role } = req.body;
      if (!email) {
        res.status(400).json({ error: 'L\'adresse e-mail est requise.' });
        return;
      }

      const emailLower = email.toLowerCase().trim();
      const isConfiguredSuperAdmin = ENV.SUPER_ADMIN_EMAILS.includes(emailLower);
      const targetRole: Role = isConfiguredSuperAdmin ? Role.SUPER_ADMIN : (role || Role.CANDIDATE);

      let user = await prisma.user.findUnique({
        where: { email: emailLower },
        include: { candidateProfile: true },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: emailLower,
            clerkId: `dev_${emailLower.replace(/[^a-zA-Z0-9]/g, '_')}`,
            firstName: emailLower.split('@')[0],
            lastName: 'ATS',
            role: targetRole,
            isVerified: true,
            candidateProfile:
              targetRole === Role.CANDIDATE
                ? {
                    create: {
                      country: 'France',
                      city: 'Paris',
                      yearsOfExp: 3,
                    },
                  }
                : undefined,
          },
          include: { candidateProfile: true },
        });
      } else if (isConfiguredSuperAdmin && user.role !== Role.SUPER_ADMIN) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: Role.SUPER_ADMIN, isVerified: true },
          include: { candidateProfile: true },
        });
      }

      const token = AuthController.generateToken(user);
      await AuditService.log(null, 'USER_LOGIN_DEV', 'User', user.id, { email: user.email, role: user.role });

      res.json({
        token,
        user: AuthController.formatUserResponse(user),
      });
    } catch (error) {
      console.error('Erreur devLogin:', error);
      res.status(500).json({ error: 'Erreur lors de la génération de session de connexion.' });
    }
  }

  // --- Helpers ---

  private static async ensureSuperAdmin(email: string, firstName: string, lastName: string, rawPassword: string): Promise<any> {
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    return await prisma.user.upsert({
      where: { email },
      update: {
        role: Role.SUPER_ADMIN,
        isActive: true,
        isVerified: true,
        passwordHash,
      },
      create: {
        email,
        clerkId: `admin_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
        firstName,
        lastName,
        role: Role.SUPER_ADMIN,
        isActive: true,
        isVerified: true,
        passwordHash,
      },
      include: { candidateProfile: true },
    });
  }

  private static generateToken(user: any): string {
    return jwt.sign(
      {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      ENV.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  /**
   * Change user password (for candidate and authenticated users)
   */
  public static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Non authentifié.' });
        return;
      }

      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' });
        return;
      }

      if (newPassword !== confirmPassword) {
        res.status(400).json({ error: 'La confirmation du mot de passe ne correspond pas au nouveau mot de passe.' });
        return;
      }

      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      if (!dbUser) {
        res.status(404).json({ error: 'Compte utilisateur introuvable.' });
        return;
      }

      // If user has an existing password, verify it
      if (dbUser.passwordHash) {
        if (!currentPassword) {
          res.status(400).json({ error: 'Veuillez saisir votre mot de passe actuel.' });
          return;
        }
        const matches = await bcrypt.compare(currentPassword, dbUser.passwordHash);
        if (!matches) {
          res.status(400).json({ error: 'Le mot de passe actuel est incorrect.' });
          return;
        }
      }

      const newHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });

      await AuditService.log(req, 'PASSWORD_CHANGE', 'User', user.id);

      // In-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Mot de passe modifié',
          message: 'Votre mot de passe a été mis à jour avec succès.',
          type: 'SYSTEM',
        },
      });

      res.json({
        success: true,
        message: 'Votre mot de passe a été modifié avec succès !',
      });
    } catch (error: any) {
      console.error('Erreur changePassword:', error);
      res.status(500).json({ error: 'Erreur technique lors du changement de mot de passe.' });
    }
  }

  private static formatUserResponse(user: any) {
    return {
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      phone: user.phone || user.candidateProfile?.phone,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
      isVerified: user.isVerified,
      profileId: user.candidateProfile?.id,
    };
  }
}
