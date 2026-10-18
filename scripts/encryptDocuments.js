import 'dotenv/config';
import { supabase } from '../Data/Config/supabase.js';
import DocumentEncryptionService from '../Data/Services/documentEncryption.service.js';

/*
R-06: encrypts the documents that were uploaded before encryption, and
re-encrypts with the current key the ones that still use
DOCUMENTS_MASTER_KEY_PREVIOUS (key rotation).

  pnpm documents:encrypt -- --dry-run   only counts, changes nothing
  pnpm documents:encrypt                encrypts in place (same path)

It can run more than once: files already encrypted with the current key
are skipped.
*/
const BUCKET = 'user-documents';
const PAGE_SIZE = 100;
const ENCRYPTED_CONTENT_TYPE = 'application/octet-stream';
// Supabase creates this file when a folder is made from the dashboard
const PLACEHOLDER = '.emptyFolderPlaceholder';

const dryRun = process.argv.includes('--dry-run');
const bucket = supabase.storage.from(BUCKET);

// Storage cannot list recursively: folders come back without an id
async function* listFiles(prefix) {
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await bucket.list(prefix, {
      limit: PAGE_SIZE,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) {
      throw new Error(error.message);
    }

    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.id === null) {
        yield* listFiles(path);
      } else if (entry.name !== PLACEHOLDER) {
        yield path;
      }
    }

    if (data.length < PAGE_SIZE) {
      return;
    }
  }
}

async function processFile(path) {
  const { data, error } = await bucket.download(path);
  if (error) {
    throw new Error(error.message);
  }

  const stored = Buffer.from(await data.arrayBuffer());

  if (DocumentEncryptionService.usesCurrentKey(stored)) {
    return 'skipped';
  }

  const wasEncrypted = DocumentEncryptionService.isEncrypted(stored);
  const plaintext = wasEncrypted
    ? DocumentEncryptionService.decrypt(stored, path)
    : stored;

  if (!dryRun) {
    const encrypted = DocumentEncryptionService.encrypt(plaintext, path);

    // Never overwrite a file with something that cannot be opened again
    if (!DocumentEncryptionService.decrypt(encrypted, path).equals(plaintext)) {
      throw new Error('Round trip check failed.');
    }

    const { error: uploadError } = await bucket.upload(path, encrypted, {
      contentType: ENCRYPTED_CONTENT_TYPE,
      upsert: true,
    });

    if (uploadError) {
      throw new Error(uploadError.message);
    }
  }

  return wasEncrypted ? 'rotated' : 'encrypted';
}

async function main() {
  DocumentEncryptionService.assertConfigured();

  const totals = { encrypted: 0, rotated: 0, skipped: 0, failed: 0 };

  for await (const path of listFiles('')) {
    try {
      totals[await processFile(path)] += 1;
    } catch (error) {
      totals.failed += 1;
      // The path only has the user id and a random name, never the content
      console.error(`Failed: ${path} (${error.message})`);
    }
  }

  const mode = dryRun ? 'DRY RUN, nothing was changed' : 'done';
  console.log(`[documents:encrypt] ${mode}`);
  console.log(`  encrypted now (were plain):   ${totals.encrypted}`);
  console.log(`  re-encrypted (previous key):  ${totals.rotated}`);
  console.log(`  already with the current key: ${totals.skipped}`);
  console.log(`  failed:                       ${totals.failed}`);

  if (totals.failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('[documents:encrypt]', error.message);
  process.exitCode = 1;
});
