const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:4000/api').replace(/\/+$/, '');

function authHeaders() {
  const token = localStorage.getItem('ib_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createConversation({ projectId, title } = {}) {
  const res = await fetch(`${API_BASE}/agent/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ projectId, title })
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function getConversations() {
  const res = await fetch(`${API_BASE}/agent/conversations`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load conversations');
  return res.json();
}

export async function getConversation(id) {
  const res = await fetch(`${API_BASE}/agent/conversations/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load conversation');
  return res.json();
}

export async function deleteConversation(id) {
  await fetch(`${API_BASE}/agent/conversations/${id}`, { method: 'DELETE', headers: authHeaders() });
}

// Async generator — yields parsed SSE chunks as they arrive.
// Caller drives the stream with `for await (const chunk of streamMessage(...))`.
export async function* streamMessage(conversationId, content) {
  const res = await fetch(`${API_BASE}/agent/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ content })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete line for next iteration

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        yield JSON.parse(line.slice(6));
      } catch { /* skip malformed chunk */ }
    }
  }
}
