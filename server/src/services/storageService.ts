import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env.js';
import { FileSecurity } from '../utils/fileSecurity.js';

export class StorageService {
  private static resumesDir = path.join(ENV.STORAGE_PATH, 'resumes');
  private static coverLettersDir = path.join(ENV.STORAGE_PATH, 'cover_letters');
  private static avatarsDir = path.join(ENV.STORAGE_PATH, 'avatars');

  public static initialize(): void {
    if (!fs.existsSync(ENV.STORAGE_PATH)) {
      fs.mkdirSync(ENV.STORAGE_PATH, { recursive: true });
    }
    if (!fs.existsSync(this.resumesDir)) {
      fs.mkdirSync(this.resumesDir, { recursive: true });
    }
    if (!fs.existsSync(this.coverLettersDir)) {
      fs.mkdirSync(this.coverLettersDir, { recursive: true });
    }
    if (!fs.existsSync(this.avatarsDir)) {
      fs.mkdirSync(this.avatarsDir, { recursive: true });
    }
  }

  /**
   * Save an uploaded avatar image buffer to secure storage
   */
  public static async saveAvatar(
    buffer: Buffer,
    originalName: string
  ): Promise<{ fileName: string; filePath: string; url: string }> {
    this.initialize();

    const ext = path.extname(originalName).toLowerCase() || '.png';
    const cleanExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.png';
    const secureFileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${cleanExt}`;
    const targetPath = path.join(this.avatarsDir, secureFileName);

    await fs.promises.writeFile(targetPath, buffer);

    return {
      fileName: secureFileName,
      filePath: targetPath,
      url: `/api/storage/avatars/${secureFileName}`,
    };
  }

  /**
   * Save an uploaded resume buffer to secure storage
   */
  public static async saveResume(
    buffer: Buffer,
    originalName: string
  ): Promise<{ fileName: string; filePath: string; fileSize: number; fileHash: string }> {
    this.initialize();

    // Verify authentic PDF magic bytes
    if (!FileSecurity.isValidPdfBuffer(buffer)) {
      throw new Error('Type de fichier non valide : signature PDF corrompue ou falsifiée.');
    }

    const secureFileName = FileSecurity.generateSecureFileName(originalName, 'resume');
    const targetPath = path.join(this.resumesDir, secureFileName);
    const fileHash = FileSecurity.calculateFileHash(buffer);

    await fs.promises.writeFile(targetPath, buffer);

    return {
      fileName: secureFileName,
      filePath: targetPath,
      fileSize: buffer.length,
      fileHash,
    };
  }

  /**
   * Save an uploaded cover letter buffer to secure storage
   */
  public static async saveCoverLetter(
    buffer: Buffer,
    originalName: string
  ): Promise<{ fileName: string; filePath: string; fileSize: number }> {
    this.initialize();

    if (!FileSecurity.isValidPdfBuffer(buffer)) {
      throw new Error('Type de fichier non valide : signature PDF corrompue ou falsifiée.');
    }

    const secureFileName = FileSecurity.generateSecureFileName(originalName, 'cl');
    const targetPath = path.join(this.coverLettersDir, secureFileName);

    await fs.promises.writeFile(targetPath, buffer);

    return {
      fileName: secureFileName,
      filePath: targetPath,
      fileSize: buffer.length,
    };
  }

  /**
   * Get secure file stream
   */
  public static getFileStream(filePath: string): fs.ReadStream {
    if (!fs.existsSync(filePath)) {
      throw new Error('Fichier introuvable sur le serveur sécurisé.');
    }
    return fs.createReadStream(filePath);
  }

  /**
   * Delete file securely
   */
  public static async deleteFile(filePath: string): Promise<boolean> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
