import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { IRitualPasswordHasher } from '../../../core/adapters/services/rituals/IRitualPasswordHasher';

const KEY_LENGTH = 64;
const HASH_PREFIX = 'scrypt';

@Injectable()
export class ScryptRitualPasswordHasher implements IRitualPasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16);
    const derivedKey = await this.deriveKey(password, salt);

    return `${HASH_PREFIX}$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    const [algorithm, saltHex, keyHex] = passwordHash.split('$');

    if (
      algorithm !== HASH_PREFIX ||
      !saltHex ||
      !keyHex ||
      !this.isValidHex(saltHex) ||
      !this.isValidHex(keyHex)
    ) {
      return false;
    }

    const salt = Buffer.from(saltHex, 'hex');
    const storedKey = Buffer.from(keyHex, 'hex');
    const derivedKey = await this.deriveKey(password, salt);

    return (
      storedKey.length === derivedKey.length &&
      timingSafeEqual(storedKey, derivedKey)
    );
  }

  private deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(password, salt, KEY_LENGTH, (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(derivedKey);
      });
    });
  }

  private isValidHex(value: string): boolean {
    return value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value);
  }
}
