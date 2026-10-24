const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const directory = process.env.EVIDENCE_DIR || path.resolve(__dirname, '../../storage/evidencias');
fs.mkdirSync(directory, { recursive: true });
const allowed = new Map([
  ['image/png', '.png'], ['image/jpeg', '.jpg'],
  ['application/pdf', '.pdf'], ['text/plain', '.txt']
]);
const storage = multer.diskStorage({
  destination: (req,file,cb) => cb(null,directory),
  filename: (req,file,cb) => cb(null,crypto.randomUUID() + allowed.get(file.mimetype))
});
const uploadEvidence = multer({
  storage, limits: { fileSize: 5*1024*1024, files: 1, fields: 8, parts: 9 },
  fileFilter: (req,file,cb) => {
    if (!allowed.has(file.mimetype)) return cb(new Error('Tipo de evidencia no permitido.'));
    cb(null,true);
  }
}).single('evidencia');
function borrarTemporal(file) { if(file?.path) fs.promises.unlink(file.path).catch(()=>{}); }
function evidenceErrorHandler(err,req,res,next) {
  if(err instanceof multer.MulterError || err.message === 'Tipo de evidencia no permitido.')
    return res.status(400).json({data:null,error:err.code==='LIMIT_FILE_SIZE'?'La evidencia supera el límite de 5 MB.':err.message});
  next(err);
}
module.exports = {directory, uploadEvidence, borrarTemporal, evidenceErrorHandler};
