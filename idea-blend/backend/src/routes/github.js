const express = require('express');
const prisma = require('../prisma');
const { optionalAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam } = require('../lib/validate');

const router = express.Router();

// GitHub requires a User-Agent header on every request or it responds with
// a confusing error instead of the data. An optional GITHUB_TOKEN lifts the
// rate limit from 60/hr (shared across anyone using this app from the same
// server IP) to 5000/hr - without one, this feature will start failing under
// real traffic almost immediately.
const GITHUB_HEADERS = {
  'User-Agent': 'idea-blend-app',
  ...(process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {})
};

function parseRepo(url) {
  // accepts https://github.com/owner/repo, with or without .git / trailing slash
  const match = url.match(/github\.com\/([^/]+)\/([^/.]+)(\.git)?\/?$/);
  if (!match) return null;
  return { owner: match[1], repo: match[2] };
}

router.get('/projects/:id/github-activity', optionalAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'project id');
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return res.status(404).json({ error: 'not found' });
  if (!project.repoUrl) return res.status(404).json({ error: 'no repo linked to this project' });

  const parsed = parseRepo(project.repoUrl);
  if (!parsed) return res.status(400).json({ error: 'stored repoUrl is not a recognizable GitHub URL' });

  const [repoRes, commitsRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`, { headers: GITHUB_HEADERS }),
    fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=5`, { headers: GITHUB_HEADERS })
  ]);

  if (repoRes.status === 403) {
    return res.status(503).json({ error: 'GitHub API rate limit reached, try again shortly' });
  }
  if (repoRes.status === 404) {
    return res.status(404).json({ error: 'repo not found or is private' });
  }
  if (!repoRes.ok) {
    return res.status(502).json({ error: 'GitHub API error' });
  }

  const repoData = await repoRes.json();
  const commitsData = commitsRes.ok ? await commitsRes.json() : [];

  res.json({
    fullName: repoData.full_name,
    description: repoData.description,
    stars: repoData.stargazers_count,
    openIssues: repoData.open_issues_count,
    defaultBranch: repoData.default_branch,
    htmlUrl: repoData.html_url,
    updatedAt: repoData.pushed_at,
    recentCommits: Array.isArray(commitsData) ? commitsData.map(c => ({
      sha: c.sha?.slice(0, 7),
      message: c.commit?.message?.split('\n')[0],
      author: c.commit?.author?.name,
      date: c.commit?.author?.date,
      url: c.html_url
    })) : []
  });
}));

module.exports = router;
