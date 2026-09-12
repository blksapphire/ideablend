const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const prisma = require('../prisma');
const { requireAuth } = require('../middlewares/authMiddleware');
const { asyncHandler } = require('../lib/asyncHandler');
const { requireIntParam } = require('../lib/validate');
const { TOOL_DEFINITIONS, executeTool } = require('../lib/agentTools');

const router = express.Router();
const client = new Anthropic();

const MODEL = process.env.AGENT_MODEL || 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;
const MAX_TOOL_ROUNDS = 5; // prevent runaway loops
const RATE_LIMIT_PER_HOUR = 20;

// Build the system prompt injected with live user context
async function buildSystemPrompt(userId, projectId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, headline: true, availability: true, userSkills: { include: { skill: true } } }
  });

  const activeProjects = await prisma.project.findMany({
    where: { ownerId: userId, status: { not: 'COMPLETED' } },
    select: { id: true, title: true },
    take: 5
  });

  const joinedProjects = await prisma.membership.findMany({
    where: { userId, active: true },
    include: { project: { select: { id: true, title: true } } },
    take: 5
  });

  let projectContext = '';
  if (projectId) {
    const project = await prisma.project.findUnique({
      where: { id: Number(projectId) },
      select: { title: true, description: true, status: true, stage: true }
    });
    if (project) {
      projectContext = `\nYou are currently in the workspace for: "${project.title}" (${project.stage}, ${project.status}).\nWhen the user says "this project" or "here", they mean this project (id: ${projectId}).`;
    }
  }

  const skills = user?.userSkills?.map(s => s.skill.name).join(', ') || 'none listed';
  const ownedTitles = activeProjects.map(p => `"${p.title}" (id:${p.id})`).join(', ') || 'none';
  const joinedTitles = joinedProjects.map(m => `"${m.project.title}" (id:${m.project.id})`).join(', ') || 'none';

  return `You are the Idea Blend assistant — a sharp, practical teammate helping builders find projects, manage their work, and collaborate. You have direct access to live platform data via tools.

Current user: ${user?.name || 'Unknown'} ${user?.headline ? `— ${user.headline}` : ''}
Skills: ${skills}
Owns: ${ownedTitles}
Member of: ${joinedTitles}
Today: ${new Date().toDateString()}
${projectContext}

Behaviour rules:
- Be specific. Use the tools. Don't guess or make things up.
- When referencing projects or builders, include their id so the frontend can link to them.
- Keep responses concise. Builders don't want essays — they want answers.
- If a tool returns an error, tell the user plainly and suggest what they can do instead.
- Never claim to do something you can't (e.g. send messages, delete data, or access private projects you're not a member of).
- The LLM agent feature is in Phase 1 — you can read data and answer questions. You cannot take actions like creating tasks or sending invites yet. Tell the user this if they ask.`.trim();
}

// Rate limit check — 20 messages per hour per user
async function checkRateLimit(userId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.agentMessage.count({
    where: {
      role: 'user',
      conversation: { userId },
      createdAt: { gte: oneHourAgo }
    }
  });
  return count < RATE_LIMIT_PER_HOUR;
}

// --- Conversation management ---

router.get('/agent/conversations', requireAuth, asyncHandler(async (req, res) => {
  const conversations = await prisma.agentConversation.findMany({
    where: { userId: req.user.id },
    orderBy: { updatedAt: 'desc' },
    take: 20,
    select: { id: true, title: true, projectId: true, createdAt: true, updatedAt: true }
  });
  res.json(conversations);
}));

router.post('/agent/conversations', requireAuth, asyncHandler(async (req, res) => {
  const { projectId, title } = req.body;
  const conv = await prisma.agentConversation.create({
    data: {
      userId: req.user.id,
      projectId: projectId ? Number(projectId) : null,
      title: title || 'New conversation'
    }
  });
  res.json(conv);
}));

router.get('/agent/conversations/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'conversation id');
  const conv = await prisma.agentConversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } }
  });
  if (!conv) return res.status(404).json({ error: 'not found' });
  if (conv.userId !== req.user.id) return res.status(403).json({ error: 'not yours' });
  res.json(conv);
}));

router.delete('/agent/conversations/:id', requireAuth, asyncHandler(async (req, res) => {
  const id = requireIntParam(req.params.id, 'conversation id');
  const conv = await prisma.agentConversation.findUnique({ where: { id } });
  if (!conv) return res.status(404).json({ error: 'not found' });
  if (conv.userId !== req.user.id) return res.status(403).json({ error: 'not yours' });
  await prisma.agentConversation.delete({ where: { id } });
  res.json({ ok: true });
}));

// --- Main streaming message endpoint ---

router.post('/agent/conversations/:id/messages', requireAuth, async (req, res) => {
  const conversationId = requireIntParam(req.params.id, 'conversation id');
  const { content } = req.body;

  if (!content?.trim()) {
    return res.status(400).json({ error: 'content required' });
  }

  const conv = await prisma.agentConversation.findUnique({
    where: { id: conversationId },
    include: { messages: { orderBy: { createdAt: 'asc' }, take: 20 } }
  });
  if (!conv) return res.status(404).json({ error: 'not found' });
  if (conv.userId !== req.user.id) return res.status(403).json({ error: 'not yours' });

  // rate limit check
  const allowed = await checkRateLimit(req.user.id);
  if (!allowed) {
    return res.status(429).json({ error: `Rate limit reached. You can send ${RATE_LIMIT_PER_HOUR} messages per hour.` });
  }

  // persist user message
  await prisma.agentMessage.create({
    data: { conversationId, role: 'user', content: content.trim() }
  });

  // update conversation title from first real user message
  if (conv.messages.length === 0 && conv.title === 'New conversation') {
    const shortTitle = content.trim().slice(0, 60);
    await prisma.agentConversation.update({ where: { id: conversationId }, data: { title: shortTitle, updatedAt: new Date() } });
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  function send(obj) {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify(obj)}\n\n`);
  }

  try {
    const systemPrompt = await buildSystemPrompt(req.user.id, conv.projectId);

    // Build messages array from history — only user and assistant roles for the API
    const history = conv.messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }));

    // Add current user message
    const messages = [...history, { role: 'user', content: content.trim() }];

    let assistantContent = '';
    let round = 0;

    // Agentic loop — keeps running until no more tool calls or max rounds hit
    while (round < MAX_TOOL_ROUNDS) {
      round++;
      const pendingToolCalls = [];

      const stream = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        tools: TOOL_DEFINITIONS,
        messages,
        stream: true
      });

      for await (const event of stream) {
        if (event.type === 'content_block_start') {
          if (event.content_block.type === 'tool_use') {
            const toolCall = { id: event.content_block.id, name: event.content_block.name, input: '' };
            pendingToolCalls.push(toolCall);
            send({ type: 'tool_start', tool: event.content_block.name });
          }
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            assistantContent += event.delta.text;
            send({ type: 'text_delta', delta: event.delta.text });
          } else if (event.delta.type === 'input_json_delta') {
            const last = pendingToolCalls[pendingToolCalls.length - 1];
            if (last) last.input += event.delta.partial_json;
          }
        } else if (event.type === 'message_stop') {
          break;
        }
      }

      // No tool calls — we're done
      if (pendingToolCalls.length === 0) break;

      // Execute all tool calls in parallel and collect results
      const toolResults = await Promise.all(
        pendingToolCalls.map(async (tc) => {
          let parsedInput = {};
          try { parsedInput = JSON.parse(tc.input || '{}'); } catch {}

          const started = Date.now();
          let output;
          let succeeded = false;
          try {
            output = await executeTool(tc.name, parsedInput, req.user.id);
            succeeded = true;
          } catch (err) {
            output = { error: err.message };
          }
          const durationMs = Date.now() - started;

          send({
            type: 'tool_result',
            tool: tc.name,
            succeeded,
            summary: summariseToolResult(tc.name, output)
          });

          // Audit log (fire-and-forget)
          prisma.agentToolCall.create({
            data: {
              messageId: 0, // updated after message persisted below
              tool: tc.name,
              input: JSON.stringify(parsedInput),
              output: JSON.stringify(output),
              succeeded,
              durationMs
            }
          }).catch(() => {});

          return {
            type: 'tool_result',
            tool_use_id: tc.id,
            content: JSON.stringify(output)
          };
        })
      );

      // Append assistant turn and tool results to message history for next loop
      messages.push({
        role: 'assistant',
        content: [
          ...pendingToolCalls.map(tc => ({
            type: 'tool_use',
            id: tc.id,
            name: tc.name,
            input: (() => { try { return JSON.parse(tc.input || '{}'); } catch { return {}; } })()
          })),
          ...(assistantContent ? [{ type: 'text', text: assistantContent }] : [])
        ]
      });
      messages.push({ role: 'user', content: toolResults });

      // Clear interim text for next round
      assistantContent = '';
    }

    // Persist the final assistant message
    const savedMessage = await prisma.agentMessage.create({
      data: { conversationId, role: 'assistant', content: assistantContent }
    });
    await prisma.agentConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    send({ type: 'done', messageId: savedMessage.id });
    res.end();
  } catch (err) {
    console.error('[agent] stream error:', err.message);
    send({ type: 'error', message: 'Something went wrong. Please try again.' });
    res.end();
  }
});

// One-liner summaries shown in the UI while tool runs
function summariseToolResult(tool, result) {
  if (result?.error) return `Failed: ${result.error}`;
  switch (tool) {
    case 'get_my_projects': return `Found ${(result.owned?.length || 0) + (result.joined?.length || 0)} projects`;
    case 'search_projects': return `Found ${result?.length || 0} projects`;
    case 'search_builders': return `Found ${result?.length || 0} builders`;
    case 'get_workspace_summary': return `${result?.tasks?.done || 0}/${result?.tasks?.total || 0} tasks done`;
    case 'get_my_applications': return `${result?.length || 0} applications`;
    case 'get_recommended_projects': return `${result?.length || 0} recommendations`;
    default: return 'Done';
  }
}

module.exports = router;
