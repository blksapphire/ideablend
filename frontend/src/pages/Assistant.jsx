import React, { useEffect, useRef, useState } from 'react';
import { useAgent } from '../context/AgentContext';
import { useAuth } from '../context/AuthContext';
import SignInPrompt from '../components/SignInPrompt';

const TOOL_LABELS = {
  get_my_projects: 'Checking your projects…',
  get_project_detail: 'Loading project details…',
  get_workspace_summary: 'Reading workspace activity…',
  search_projects: 'Searching projects…',
  search_builders: 'Finding builders…',
  get_my_applications: 'Checking your applications…',
  get_my_notifications: 'Loading notifications…',
  get_recommended_projects: 'Finding matches for you…'
};

const SUGGESTED_PROMPTS = [
  'What projects match my skills?',
  'Summarise my active projects',
  'Find backend developers open to equity',
  'What applications are still pending?',
  'What have I missed recently?'
];

function Message({ msg, isStreaming }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-md bg-blue dark:bg-blue-dark flex items-center justify-center shrink-0 mr-2 mt-0.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
            <path d="M12 2l2.4 6.4L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.6z" />
          </svg>
        </div>
      )}
      <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
        isUser
          ? 'bg-blue dark:bg-blue-dark text-white rounded-br-sm'
          : 'bg-surface dark:bg-surfacedark border border-ink/20 dark:border-ink-dark/20 rounded-bl-sm'
      } ${isStreaming ? 'border-blue/40 dark:border-blue-dark/40' : ''}`}>
        {msg.content}
        {isStreaming && <span className="inline-block w-1 h-3.5 bg-blue dark:bg-blue-dark ml-1 animate-pulse rounded-sm" />}
      </div>
    </div>
  );
}

function ToolIndicator({ tool }) {
  if (!tool) return null;
  return (
    <div className="flex justify-start mb-3">
      <div className="w-6 h-6 rounded-md bg-blue dark:bg-blue-dark flex items-center justify-center shrink-0 mr-2 mt-0.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
          <path d="M12 2l2.4 6.4L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.6z" />
        </svg>
      </div>
      <div className="flex items-center gap-2 text-sm text-ink/50 dark:text-ink-dark/50 bg-surface dark:bg-surfacedark border border-ink/20 dark:border-ink-dark/20 rounded-xl px-4 py-2.5 rounded-bl-sm">
        <span className="animate-spin text-blue dark:text-blue-dark">◆</span>
        {TOOL_LABELS[tool] || 'Working…'}
      </div>
    </div>
  );
}

function ConversationList({ onNew }) {
  const { conversations, activeConvId, openConversation, removeConversation, loadConversations } = useAgent();

  useEffect(() => { loadConversations(); }, []);

  return (
    <div className="w-56 shrink-0 border-r border-ink/10 dark:border-ink-dark/10 flex flex-col h-full">
      <div className="p-3 border-b border-ink/10 dark:border-ink-dark/10">
        <button onClick={onNew} className="w-full py-2 rounded-lg bg-blue dark:bg-blue-dark text-white text-sm font-semibold">
          + New chat
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 && (
          <p className="text-xs text-ink/40 dark:text-ink-dark/40 px-3 py-2">No conversations yet</p>
        )}
        {conversations.map(c => (
          <div
            key={c.id}
            onClick={() => openConversation(c.id)}
            className={`group flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg mx-2 ${
              activeConvId === c.id ? 'bg-blue-soft dark:bg-blue-softdark' : 'hover:bg-page dark:hover:bg-pagedark'
            }`}
          >
            <span className={`text-xs truncate ${activeConvId === c.id ? 'text-blue-text dark:text-blue-textdark font-medium' : 'text-ink/70 dark:text-ink-dark/70'}`}>
              {c.title}
            </span>
            <button
              onClick={e => { e.stopPropagation(); removeConversation(c.id); }}
              className="opacity-0 group-hover:opacity-100 text-ink/40 dark:text-ink-dark/40 hover:text-red-500 text-xs ml-1 shrink-0"
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Assistant() {
  const { user } = useAuth();
  const { messages, streaming, currentDelta, toolInProgress, error, sendMessage, startConversation, activeConvId } = useAgent();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, currentDelta, toolInProgress]);

  if (!user) return <SignInPrompt message="Sign in to use the Idea Blend assistant." />;

  async function handleSend(text) {
    const content = (text || input).trim();
    if (!content || streaming) return;
    setInput('');
    await sendMessage(content);
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  const showEmptyState = !activeConvId && messages.length === 0;

  return (
    <div className="max-w-6xl mx-auto flex h-[calc(100vh-73px)]">
      <ConversationList onNew={() => startConversation()} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-3 border-b border-ink/10 dark:border-ink-dark/10 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue dark:bg-blue-dark flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M12 2l2.4 6.4L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.6z" />
            </svg>
          </div>
          <span className="font-display font-semibold text-sm">Idea Blend Assistant</span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-green-soft dark:bg-green-softdark text-green-text dark:text-green-textdark">BETA</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {showEmptyState && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-blue-soft dark:bg-blue-softdark flex items-center justify-center mb-4">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
              </div>
              <h2 className="font-display font-bold text-lg mb-1">Your Idea Blend assistant</h2>
              <p className="text-sm text-ink/50 dark:text-ink-dark/50 mb-6">Ask about projects, find builders, or get a summary of what's happening across your work.</p>
              <div className="flex flex-col gap-2 w-full">
                {SUGGESTED_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="text-left text-sm px-4 py-2.5 rounded-lg border border-ink/20 dark:border-ink-dark/20 hover:border-blue/40 dark:hover:border-blue-dark/40 hover:bg-blue-soft/30 dark:hover:bg-blue-softdark/30 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => <Message key={msg.id} msg={msg} />)}

          {streaming && currentDelta && (
            <Message msg={{ role: 'assistant', content: currentDelta }} isStreaming />
          )}

          {toolInProgress && !currentDelta && <ToolIndicator tool={toolInProgress} />}

          {error && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg px-4 py-2.5 mb-3">
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-ink/10 dark:border-ink-dark/10">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about projects, builders, or your workspace…"
              rows={1}
              className="flex-1 resize-none p-3 rounded-xl border border-ink/20 dark:border-ink-dark/20 bg-surface dark:bg-surfacedark text-sm focus:border-blue dark:focus:border-blue-dark outline-none transition-colors"
              style={{ maxHeight: '160px', overflowY: 'auto' }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || streaming}
              className="w-10 h-10 rounded-xl bg-blue dark:bg-blue-dark text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
            >
              {streaming
                ? <span className="animate-spin text-xs">◆</span>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" /></svg>
              }
            </button>
          </div>
          <p className="text-[10px] text-ink/30 dark:text-ink-dark/30 mt-2 text-center">
            Phase 1 — read access only · 20 messages/hour · <span className="font-mono">Enter</span> to send
          </p>
        </div>
      </div>
    </div>
  );
}
