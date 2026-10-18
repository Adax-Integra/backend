import crypto from 'node:crypto';

/*
R-06: identity documents are stored encrypted (envelope encryption).

Every file gets its own random data key (DEK). The file is encrypted with
the DEK and the DEK is encrypted ("wrapped") with the master key that lives
in DOCUMENTS_MASTER_KEY. Both use AES-256-GCM, so any change to the stored
bytes makes the decryption fail instead of returning a corrupted image.

*/
const ALGORITHM = 'aes-256-gcm';
const MAGIC = Buffer.from('ADXD', 'ascii');
const VERSION = 1;
const KEY_LENGTH = 32;
const KEY_ID_LENGTH = 8;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const KEY_ID_OFFSET = MAGIC.length + 1;
const WRAP_IV_OFFSET = KEY_ID_OFFSET + KEY_ID_LENGTH;
const WRAP_TAG_OFFSET = WRAP_IV_OFFSET + IV_LENGTH;
const WRAPPED_KEY_OFFSET = WRAP_TAG_OFFSET + TAG_LENGTH;
const DATA_IV_OFFSET = WRAPPED_KEY_OFFSET + KEY_LENGTH;
const DATA_TAG_OFFSET = DATA_IV_OFFSET + IV_LENGTH;
const HEADER_LENGTH = DATA_TAG_OFFSET + TAG_LENGTH;

const CURRENT_KEY_ENV = 'DOCUMENTS_MASTER_KEY';
// Only used while rotating the master key, files are never encrypted with it
const PREVIOUS_KEY_ENV = 'DOCUMENTS_MASTER_KEY_PREVIOUS';

function readKey(name) {
  const value = process.env[name];
  if (!value) {
    return null;
  }

  const key = Buffer.from(value, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new Error(`${name} must be 32 random bytes encoded in base64.`);
  }

  return key;
}

// The id is a fingerprint of the key, so the key itself is never stored
function keyIdOf(key) {
  return crypto
    .createHash('sha256')
    .update(key)
    .digest()
    .subarray(0, KEY_ID_LENGTH);
}

function currentKey() {
  const key = readKey(CURRENT_KEY_ENV);
  if (!key) {
    throw new Error(`Missing ${CURRENT_KEY_ENV} environment variable.`);
  }

  return { id: keyIdOf(key), key };
}

function findKey(keyId) {
  const keys = [readKey(CURRENT_KEY_ENV), readKey(PREVIOUS_KEY_ENV)].filter(
    Boolean
  );

  return keys.find((key) => keyIdOf(key).equals(keyId)) ?? null;
}

function versionHeader() {
  return Buffer.concat([MAGIC, Buffer.from([VERSION])]);
}

function decryptionError() {
  return new Error('Document could not be decrypted.');
}

class DocumentEncryptionService {
  // Fails at startup when the master key is missing or malformed
  static assertConfigured() {
    currentKey();
  }

  // Images uploaded before encryption start with their own JPEG/PNG bytes
  static isEncrypted(buffer) {
    return (
      Buffer.isBuffer(buffer) &&
      buffer.length >= HEADER_LENGTH &&
      buffer.subarray(0, MAGIC.length).equals(MAGIC)
    );
  }

  // True when the file is encrypted with the current master key
  static usesCurrentKey(buffer) {
    return (
      DocumentEncryptionService.isEncrypted(buffer) &&
      buffer.subarray(KEY_ID_OFFSET, WRAP_IV_OFFSET).equals(currentKey().id)
    );
  }

  /*
  The storage path is the additional authenticated data (AAD): a file
  copied to another user's folder can no longer be decrypted.
  */
  static encrypt(plaintext, storagePath) {
    const { id, key } = currentKey();
    const dataKey = crypto.randomBytes(KEY_LENGTH);

    try {
      const wrapIv = crypto.randomBytes(IV_LENGTH);
      const wrapCipher = crypto.createCipheriv(ALGORITHM, key, wrapIv);
      wrapCipher.setAAD(Buffer.concat([versionHeader(), id]));
      const wrappedKey = Buffer.concat([
        wrapCipher.update(dataKey),
        wrapCipher.final(),
      ]);
      const wrapTag = wrapCipher.getAuthTag();

      const dataIv = crypto.randomBytes(IV_LENGTH);
      const dataCipher = crypto.createCipheriv(ALGORITHM, dataKey, dataIv);
      dataCipher.setAAD(Buffer.from(storagePath, 'utf8'));
      const ciphertext = Buffer.concat([
        dataCipher.update(plaintext),
        dataCipher.final(),
      ]);
      const dataTag = dataCipher.getAuthTag();

      return Buffer.concat([
        versionHeader(),
        id,
        wrapIv,
        wrapTag,
        wrappedKey,
        dataIv,
        dataTag,
        ciphertext,
      ]);
    } finally {
      // The data key only lives in memory while this file is encrypted
      dataKey.fill(0);
    }
  }

  static decrypt(encrypted, storagePath) {
    if (!DocumentEncryptionService.isEncrypted(encrypted)) {
      throw decryptionError();
    }
    if (encrypted[MAGIC.length] !== VERSION) {
      throw decryptionError();
    }

    const keyId = encrypted.subarray(KEY_ID_OFFSET, WRAP_IV_OFFSET);
    const key = findKey(keyId);
    if (!key) {
      throw new Error('Document was encrypted with an unknown master key.');
    }

    let dataKey;
    try {
      const wrapDecipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        encrypted.subarray(WRAP_IV_OFFSET, WRAP_TAG_OFFSET)
      );
      wrapDecipher.setAAD(Buffer.concat([versionHeader(), keyId]));
      wrapDecipher.setAuthTag(
        encrypted.subarray(WRAP_TAG_OFFSET, WRAPPED_KEY_OFFSET)
      );
      dataKey = Buffer.concat([
        wrapDecipher.update(
          encrypted.subarray(WRAPPED_KEY_OFFSET, DATA_IV_OFFSET)
        ),
        wrapDecipher.final(),
      ]);

      const dataDecipher = crypto.createDecipheriv(
        ALGORITHM,
        dataKey,
        encrypted.subarray(DATA_IV_OFFSET, DATA_TAG_OFFSET)
      );
      dataDecipher.setAAD(Buffer.from(storagePath, 'utf8'));
      dataDecipher.setAuthTag(
        encrypted.subarray(DATA_TAG_OFFSET, HEADER_LENGTH)
      );

      return Buffer.concat([
        dataDecipher.update(encrypted.subarray(HEADER_LENGTH)),
        dataDecipher.final(),
      ]);
    } catch {
      // GCM refuses tampered bytes, a wrong path or a wrong key
      throw decryptionError();
    } finally {
      dataKey?.fill(0);
    }
  }
}

export default DocumentEncryptionService;
