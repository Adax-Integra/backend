import multer from 'multer';

// 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

// The client sets the mimetype, so the first bytes confirm the real file type
const FILE_SIGNATURES = {
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
};

function matchesSignature(file) {
  const signature = FILE_SIGNATURES[file.mimetype];
  return (
    signature !== undefined &&
    signature.every((byte, index) => file.buffer[index] === byte)
  );
}

const upload = multer({
  storage: multer.memoryStorage(),
  /*
  Leaving the file size capped at 2 for the multer,
  if someone needs to upload more than 2 files in another
  user story, just change the "files" key in limits.
  */
  limits: { fileSize: MAX_FILE_SIZE, files: 2 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error(`${file.fieldname}: only PDF, JPEG or PNG allowed.`));
    }
    cb(null, true);
  },
});

// Pre-submission
const preSubmissionUpload = upload.fields([
  { name: 'identity_document', maxCount: 1 },
  { name: 'proof_of_address', maxCount: 1 },
]);

function preSubmissionUploadMiddleware(req, res, next) {
  preSubmissionUpload(req, res, (error) => {
    if (!error) {
      // fileFilter only sees the mimetype, the buffer exists after multer ends
      const invalidFile = Object.values(req.files ?? {})
        .flat()
        .find((file) => !matchesSignature(file));

      if (invalidFile) {
        return res.status(400).json({
          success: false,
          error: `${invalidFile.fieldname}: only PDF, JPEG or PNG allowed.`,
        });
      }
      return next();
    }
    /*
    If the error is about file size, return the limit file size,
    otherwise return the error message.
    */
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the 5 MB limit.'
        : error.message;
    return res.status(400).json({ success: false, error: message });
  });
}

// E-04 Event image, a separate config because events only accept pictures
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

const eventImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return cb(new Error('image: only JPEG or PNG allowed.'));
    }
    cb(null, true);
  },
}).single('image');

export function eventImageUploadMiddleware(req, res, next) {
  eventImageUpload(req, res, (error) => {
    if (!error) return next();
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? 'File exceeds the 5 MB limit.'
        : error.message;
    return res.status(400).json({ success: false, error: message });
  });
}

export default preSubmissionUploadMiddleware;
