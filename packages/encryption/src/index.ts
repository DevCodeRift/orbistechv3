import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly IV_LENGTH = 16;
  private static readonly TAG_LENGTH = 16;

  /**
   * Generate a key from a password and salt
   */
  private static async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return (await scryptAsync(password, salt, this.KEY_LENGTH)) as Buffer;
  }

  /**
   * Encrypt a string using AES-256-GCM
   */
  static async encrypt(plaintext: string, password?: string): Promise<string> {
    try {
      const encryptionPassword = password || process.env.ENCRYPTION_KEY;
      if (!encryptionPassword) {
        throw new Error('Encryption password not provided');
      }

      const salt = randomBytes(32);
      const iv = randomBytes(this.IV_LENGTH);
      const key = await this.deriveKey(encryptionPassword, salt);

      const cipher = createCipheriv(this.ALGORITHM, key, iv);

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const tag = cipher.getAuthTag();

      // Combine salt + iv + tag + encrypted data
      const combined = Buffer.concat([
        salt,
        iv,
        tag,
        Buffer.from(encrypted, 'hex')
      ]);

      return combined.toString('base64');
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt a string using AES-256-GCM
   */
  static async decrypt(encryptedData: string, password?: string): Promise<string> {
    try {
      const decryptionPassword = password || process.env.ENCRYPTION_KEY;
      if (!decryptionPassword) {
        throw new Error('Decryption password not provided');
      }

      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const salt = combined.subarray(0, 32);
      const iv = combined.subarray(32, 32 + this.IV_LENGTH);
      const tag = combined.subarray(32 + this.IV_LENGTH, 32 + this.IV_LENGTH + this.TAG_LENGTH);
      const encrypted = combined.subarray(32 + this.IV_LENGTH + this.TAG_LENGTH);

      const key = await this.deriveKey(decryptionPassword, salt);

      const decipher = createDecipheriv(this.ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Encrypt API key for database storage
   */
  static async encryptApiKey(apiKey: string): Promise<string> {
    return this.encrypt(apiKey);
  }

  /**
   * Decrypt API key from database
   */
  static async decryptApiKey(encryptedApiKey: string): Promise<string> {
    return this.decrypt(encryptedApiKey);
  }

  /**
   * Encrypt Discord bot token for database storage
   */
  static async encryptBotToken(botToken: string): Promise<string> {
    return this.encrypt(botToken);
  }

  /**
   * Decrypt Discord bot token from database
   */
  static async decryptBotToken(encryptedBotToken: string): Promise<string> {
    return this.decrypt(encryptedBotToken);
  }

  /**
   * Generate a secure random token
   */
  static generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Hash a string for comparison (one-way)
   */
  static async hashString(input: string): Promise<string> {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(input).digest('hex');
  }

  /**
   * Validate that an encrypted value can be decrypted
   */
  static async validateEncrypted(encryptedData: string, password?: string): Promise<boolean> {
    try {
      await this.decrypt(encryptedData, password);
      return true;
    } catch {
      return false;
    }
  }
}

// Helper functions for common operations
export async function encryptApiKey(apiKey: string): Promise<string> {
  return EncryptionService.encryptApiKey(apiKey);
}

export async function decryptApiKey(encryptedApiKey: string): Promise<string> {
  return EncryptionService.decryptApiKey(encryptedApiKey);
}

export async function encryptBotToken(botToken: string): Promise<string> {
  return EncryptionService.encryptBotToken(botToken);
}

export async function decryptBotToken(encryptedBotToken: string): Promise<string> {
  return EncryptionService.decryptBotToken(encryptedBotToken);
}

export function generateSecureToken(length?: number): string {
  return EncryptionService.generateSecureToken(length);
}

export async function hashString(input: string): Promise<string> {
  return EncryptionService.hashString(input);
}

export async function validateEncrypted(encryptedData: string): Promise<boolean> {
  return EncryptionService.validateEncrypted(encryptedData);
}