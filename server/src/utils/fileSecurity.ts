import crypto from 'crypto';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';

// PDF Magic Bytes: %PDF- (0x25 0x50 0x44 0x46)
const PDF_MAGIC_BYTES = Buffer.from([0x25, 0x50, 0x44, 0x46]);

export interface SignedFileTokenPayload {
  fileId: string;
  filePath: string;
  userId: string;
  action: 'view' | 'download';
  exp: number;
}

export class FileSecurity {
  /**
   * Validate that the buffer starts with the authentic PDF magic bytes
   */
  static isValidPdfBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) return false;
    return buffer.subarray(0, 4).equals(PDF_MAGIC_BYTES);
  }

  /**
   * Validate a file on disk by reading its initial magic bytes
   */
  static isValidPdfFile(filePath: string): boolean {
    try {
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(4);
      fs.readSync(fd, buffer, 0, 4, 0);
      fs.closeSync(fd);
      return buffer.equals(PDF_MAGIC_BYTES);
    } catch {
      return false;
    }
  }

  /**
   * Calculate SHA-256 hash of a file for duplicate detection
   */
  static calculateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Generate an unguessable UUID-based storage filename
   */
  static generateSecureFileName(originalName: string, prefix = 'cv'): string {
    const randomUuid = crypto.randomUUID();
    const cleanPrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '');
    return `${cleanPrefix}_${randomUuid}.pdf`;
  }

  /**
   * Generate a signed temporary download URL (valid for 15 minutes)
   */
  static generateSignedDownloadToken(fileId: string, filePath: string, userId: string): string {
    const expiresInSeconds = 15 * 60; // 15 minutes
    return jwt.sign(
      {
        fileId,
        filePath,
        userId,
        action: 'download',
      },
      ENV.JWT_SECRET,
      { expiresIn: expiresInSeconds }
    );
  }

  /**
   * Verify and decode a signed download token
   */
  static verifySignedDownloadToken(token: string): SignedFileTokenPayload | null {
    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as SignedFileTokenPayload;
      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Sanitize text against potential prompt injection attacks
   */
  static sanitizeTextForAi(input: string): string {
    if (!input) return '';
    // Strip null bytes and normalize control characters
    let sanitized = input.replace(/\0/g, '');
    // Neutralize prompt jailbreak patterns
    sanitized = sanitized.replace(/ignore\s+(all\s+)?(previous|prior)\s+instructions/gi, '[neutralized_prompt_attempt]');
    sanitized = sanitized.replace(/you\s+are\s+now\s+in\s+developer\s+mode/gi, '[neutralized_prompt_attempt]');
    sanitized = sanitized.replace(/system\s*:\s*/gi, 'note: ');
    return sanitized.trim();
  }
}
