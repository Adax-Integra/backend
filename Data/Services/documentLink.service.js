import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

/*
R-06 / V-13: the apps download the documents through the backend, which
decrypts them. The link carries a short-lived token instead of the session
token, so Android and iOS keep opening the "url" as they did with the
Supabase signed URLs.
*/
const LINK_EXPIRES_IN_SECONDS = 60 * 5;
const LINK_AUDIENCE = 'document-file';
const LINK_ALGORITHM = 'HS256';
const DOCUMENT_FIELDS = ['identity_document', 'proof_of_address'];

/*
The signing key is derived from the master key, so no other secret is
needed and a session token (JWT_SECRET) can never be used as a link.
*/
function signingKey() {
  const value = process.env.DOCUMENTS_MASTER_KEY;
  if (!value) {
    throw new Error('Missing DOCUMENTS_MASTER_KEY environment variable.');
  }

  return Buffer.from(
    crypto.hkdfSync(
      'sha256',
      Buffer.from(value, 'base64'),
      Buffer.alloc(0),
      'adax-integra/document-links',
      32
    )
  );
}

// The link points to one version of the file: replacing it invalidates the link
function pathFingerprint(storagePath) {
  return crypto
    .createHash('sha256')
    .update(storagePath)
    .digest('base64url')
    .slice(0, 22);
}

function invalidLinkError() {
  const error = new Error('The link is invalid or expired.');
  error.status = 403;
  return error;
}

class DocumentLinkService {
  static sign({ userId, field, storagePath }) {
    return jwt.sign(
      { field, path_hash: pathFingerprint(storagePath) },
      signingKey(),
      {
        algorithm: LINK_ALGORITHM,
        audience: LINK_AUDIENCE,
        subject: userId,
        expiresIn: LINK_EXPIRES_IN_SECONDS,
      }
    );
  }

  // Returns the owner and the document the link was created for
  static verify(token) {
    let payload;
    try {
      payload = jwt.verify(token, signingKey(), {
        algorithms: [LINK_ALGORITHM],
        audience: LINK_AUDIENCE,
      });
    } catch {
      throw invalidLinkError();
    }

    if (!payload.sub || !DOCUMENT_FIELDS.includes(payload.field)) {
      throw invalidLinkError();
    }

    return {
      userId: payload.sub,
      field: payload.field,
      pathHash: payload.path_hash,
    };
  }

  static matchesPath(pathHash, storagePath) {
    return (
      typeof storagePath === 'string' &&
      storagePath.length > 0 &&
      pathFingerprint(storagePath) === pathHash
    );
  }

  static buildUrl(baseUrl, token) {
    return `${baseUrl}/api/documents/files/${token}`;
  }
}

export default DocumentLinkService;
