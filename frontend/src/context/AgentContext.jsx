import React, { createContext, useCallback, useContext, useState } from 'react';
import {
  createConversation, getConversations, getConversation,
  deleteConversation, streamMessage
} from '../lib/agentApi';

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [currentDelta, setCurrentDelta] = useState('');
  const [toolInProgress, setToolInProgress] = useState(null); // tool name currently executing
  const [error, setError] = useState(null);

  const loadConversations = useCallback(async () => {
    try {
      const data = await getConversations();
      setConversations(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const openConversation = useCallback(async (id) => {
    setActiveConvId(id);
    setCurrentDelta('');
    setToolInProgress(null);
    try {
      const conv = await getConversation(id);
      setMessages(conv.messages || []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const startConversation = useCallback(async ({ projectId, title } = {}) => {
    const conv = await createConversation({ projectId, title });
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(conv.id);
    setMessages([]);
    return conv;
  }, []);

  const removeConversation = useCallback(async (id) => {
    await deleteConversation(id);
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  }, [activeConvId]);

  const sendMessage = useCallback(async (content, { projectId } = {}) => {
    setError(null);
    let convId = activeConvId;

    // auto-create a conversation if none is active
    if (!convId) {
      const conv = await startConversation({ projectId });
      convId = conv.id;
    }

    // append user message locally immediately — don't wait for the server round trip
    const userMsg = { id: Date.now(), role: 'user', content, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setCurrentDelta('');
    setToolInProgress(null);

    try {
      let delta = '';
      for await (const chunk of streamMessage(convId, content)) {
        if (chunk.type === 'text_delta') {
          delta += chunk.delta;
          setCurrentDelta(delta);
        } else if (chunk.type === 'tool_start') {
          setToolInProgress(chunk.tool);
        } else if (chunk.type === 'tool_result') {
          setToolInProgress(null);
        } else if (chunk.type === 'done') {
          // flush the streamed response into the messages array as a proper message
          setMessages(prev => [
            ...prev,
            { id: chunk.messageId, role: 'assistant', content: delta, createdAt: new Date().toISOString() }
          ]);
          setCurrentDelta('');
          // refresh conversation list to update title/updatedAt
          loadConversations();
        } else if (chunk.type === 'error') {
          setError(chunk.message);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setStreaming(false);
      setToolInProgress(null);
    }
  }, [activeConvId, startConversation, loadConversations]);

  return (
    <AgentContext.Provider value={{
      conversations, activeConvId, messages, streaming,
      currentDelta, toolInProgress, error,
      loadConversations, openConversation, startConversation,
      removeConversation, sendMessage
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used within AgentProvider');
  return ctx;
}
