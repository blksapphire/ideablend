const express = require('express');
const multer = require('multer');
const prisma = require('../prisma');
const storage = require('../lib/storage');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam } = require('../lib/validate');
const { assertMember } = require('../lib/projectAccess');

const router = express.Router();

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB - this is for specs/mockups/decks, not code hosting or video

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE } });

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

  const storedName = await storage.saveProjectFile(req.file.buffer, req.file.originalname, req.file.mimetype);
  const record = await prisma.projectFile.create({
    data: {
      projectId,
      uploaderId: req.user.id,
      filename: req.file.originalname,
      storedName,
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

  const { stream, contentType } = await storage.openProjectFile(file.storedName);
  res.setHeader('Content-Type', contentType || file.mimeType || 'application/octet-stream');
  res.attachment(file.filename);
  stream.on('error', () => res.end());
  stream.pipe(res);
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

  await storage.deleteProjectFile(file.storedName);
  await prisma.projectFile.delete({ where: { id } });
  res.json({ ok: true });
}));

module.exports = router;
