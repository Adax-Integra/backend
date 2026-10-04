import multer from 'multer';

// 5 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

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
    if (!error) return next();
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

export default preSubmissionUploadMiddleware;
