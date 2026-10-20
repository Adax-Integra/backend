// Used for generating random file names.
import crypto from 'node:crypto';
import { supabase } from '../Config/supabase.js';
import DocumentEncryptionService from '../Services/documentEncryption.service.js';
import DocumentLinkService from '../Services/documentLink.services.js';

const USER_DOCUMENTS_BUCKET = 'user-documents';
// The bucket only holds encrypted bytes, the real type comes from the path
const ENCRYPTED_CONTENT_TYPE = 'application/octet-stream';
const SIGNED_URL_FIELDS = ['identity_document', 'proof_of_address'];
// Folder inside "{userId}/" where each document type is stored
const DOCUMENT_FOLDERS = {
  identity_document: 'identity',
  proof_of_address: 'address',
};
const FILE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
};
// Old uploads can still be PDF, they are served with their own type
const CONTENT_TYPES = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
};

/*
Data Model for external user access to the "user_documents" table.

Files live in the "user-documents" Storage bucket.
The table stores path strings. attachSignedUrls turns those paths into
short-lived links to the backend, which decrypts the file (downloadFile).
API responses include the links, not the paths.
*/
class ExternalUserDocumentsModel {
  static async findByUserId(userId) {
    const { data, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  static async updateByUserId(userId, payload) {
    const { data, error } = await supabase
      .from('user_documents')
      .update(payload)
      .eq('user_id', userId)
      .is('deleted_at', null)
      .select('*')
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }
    if (!data) {
      throw new Error('User documents not found.');
    }

    return data;
  }

  /*
  Attach signed links to the documents to be returned to the client.
  The links point to the backend (GET /api/documents/files/:token), never
  to Storage, because Storage only has the encrypted bytes.
  */
  static async attachSignedUrls(documents, baseUrl) {
    if (!documents) {
      return null;
    }

    const urlFor = (field) => {
      const storagePath = documents[field];
      if (typeof storagePath !== 'string' || storagePath.length === 0) {
        return null;
      }

      const token = DocumentLinkService.sign({
        userId: documents.user_id,
        field,
        storagePath,
      });
      return DocumentLinkService.buildUrl(baseUrl, token);
    };

    const [identityUrl, addressUrl] = SIGNED_URL_FIELDS.map(urlFor);

    return {
      document_id: documents.document_id,
      identity_document_url: identityUrl,
      proof_of_address_url: addressUrl,
    };
  }

  /*
  Uploads a file to the "user-documents" bucket under "{userId}/{folder}/"
  and returns its path. The file name is generated here, the user's file name
  will not be taken into consideration.
  */
  static async uploadFile(userId, key, file) {
    const extension = FILE_EXTENSIONS[file.mimetype];
    if (!extension) {
      throw new Error(`${key}: unsupported file type.`);
    }

    const folder = DOCUMENT_FOLDERS[key];
    if (!folder) {
      throw new Error(`${key}: unsupported document type.`);
    }

    const path = `${userId}/${folder}/${crypto.randomUUID()}.${extension}`;

    // The image is encrypted before it leaves the backend
    const encrypted = DocumentEncryptionService.encrypt(file.buffer, path);

    const { error } = await supabase.storage
      .from(USER_DOCUMENTS_BUCKET)
      .upload(path, encrypted, { contentType: ENCRYPTED_CONTENT_TYPE });

    if (error) {
      throw new Error(error.message);
    }

    return path;
  }

  /*
  Downloads a file from the bucket and returns it decrypted, with the
  content type of the original image.
  */
  static async downloadFile(path) {
    const { data, error } = await supabase.storage
      .from(USER_DOCUMENTS_BUCKET)
      .download(path);

    if (error) {
      throw new Error(error.message);
    }

    const stored = Buffer.from(await data.arrayBuffer());
    const extension = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
    const contentType = CONTENT_TYPES[extension] ?? ENCRYPTED_CONTENT_TYPE;

    /*
    Files uploaded before R-06 encryption are still plain until the
    "pnpm documents:encrypt" script runs, so they are served as they are.
    */
    if (!DocumentEncryptionService.isEncrypted(stored)) {
      console.warn('[documents] Serving a file that is not encrypted yet.');
      return { buffer: stored, contentType };
    }

    return {
      buffer: DocumentEncryptionService.decrypt(stored, path),
      contentType,
    };
  }

  // Removes files from the bucket (just in case a step fails)
  static async removeFiles(paths) {
    if (paths.length === 0) {
      return;
    }

    const { error } = await supabase.storage
      .from(USER_DOCUMENTS_BUCKET)
      .remove(paths);

    if (error) {
      throw new Error(error.message);
    }
  }

  /* 
  Checks if a file exists in the "user-documents" bucket
  We need this method if the upload failed or never finished
  */
  static async pathExists(path) {
    const lastSlash = path.lastIndexOf('/');
    const folder = path.slice(0, lastSlash);
    const fileName = path.slice(lastSlash + 1);

    const { data, error } = await supabase.storage
      .from(USER_DOCUMENTS_BUCKET)
      .list(folder, { search: fileName });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).some((file) => file.name === fileName);
  }
}

export default ExternalUserDocumentsModel;
