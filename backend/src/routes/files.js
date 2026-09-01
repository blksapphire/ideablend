const express = require('express');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam, requireFields } = require('../lib/validate');
const { assertMember } = require('../lib/projectAccess');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB - this is for specs/mockups/decks, not code hosting or video

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    cb(null, randomName + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

router.get('/projects/:projectId/files', requireAuth, asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const check = await assertMember(projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });

  const files = await prisma.projectFile.findMany({
    where: { projectId },
    include: { uploader: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  res.json(files);
}));

router.post('/projects/:projectId/files', requireAuth, upload.single('file'), asyncHandler(async (req, res) => {
  const projectId = requireIntParam(req.params.projectId, 'project id');
  const check = await assertMember(projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });
  if (!req.file) return res.status(400).json({ error: 'no file provided' });

  const record = await prisma.projectFile.create({
    data: {
      projectId,
      uploaderId: req.user.id,
      filename: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size
    }
  });
  res.json(record);
}));

router.get('/files/:id/download', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'file id');
  const file = await prisma.projectFile.findUnique({ where: { id } });
  if (!file) return res.status(404).json({ error: 'not found' });

  const check = await assertMember(file.projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });

  res.download(path.join(UPLOAD_DIR, file.storedName), file.filename);
}));

router.delete('/files/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'file id');
  const file = await prisma.projectFile.findUnique({ where: { id } });
  if (!file) return res.status(404).json({ error: 'not found' });

  const check = await assertMember(file.projectId, req.user.id);
  if (check.error) return res.status(check.code).json({ error: check.error });
  if (file.uploaderId !== req.user.id && !check.isOwner) {
    return res.status(403).json({ error: 'only the uploader or project owner can delete this file' });
  }

  const fs = require('fs');
  fs.unlink(path.join(UPLOAD_DIR, file.storedName), () => {}); // best-effort - don't fail the request over a disk cleanup issue
  await prisma.projectFile.delete({ where: { id } });
  res.json({ ok: true });
}));

module.exports = router;
