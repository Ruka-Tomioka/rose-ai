import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, ChevronDown, Heart, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react';
import { useSendGraceChat } from '@/api-client';
import type { GraceChatMessage, GraceSupportResource } from '@/api-client';

const STORAGE_KEY = 'grace-ai-conversation';
const DISCLOSURE_STORAGE_KEY = 'grace-ai-disclosure-seen';
const SUPPORT_STORAGE_KEY = 'grace-ai-support-resources';

function readConversation(): GraceChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is GraceChatMessage => (
      typeof item === 'object' &&
      item !== null &&
      ('role' in item) &&
      ('content' in item) &&
      (item.role === 'user' || item.role === 'assistant') &&
      typeof item.content === 'string'
    )).slice(-40);
  } catch {
    return [];
  }
}

function readOpeningPrompt() {
  if (typeof window === 'undefined') return '';
  return new URLSearchParams(window.location.search).get('prompt')?.trim() ?? '';
}

function persistConversation(messages: GraceChatMessage[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
  } catch {
    // Local persistence is a kindness, not a requirement.
  }
}

function hasSeenDisclosure() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(DISCLOSURE_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function readSupportResources(): GraceSupportResource[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = window.localStorage.getItem(SUPPORT_STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is GraceSupportResource => (
      typeof item === 'object' &&
      item !== null &&
      'label' in item &&
      'detail' in item &&
      'phone' in item &&
      typeof item.label === 'string' &&
      typeof item.detail === 'string' &&
      typeof item.phone === 'string'
    ));
  } catch {
    return [];
  }
}

function TypingMessage() {
  return (
    <div className="flex items-start gap-3" data-testid="status-grace-thinking">
      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Heart className="size-3.5 fill-current" /></div>
      <div className="rounded-2xl rounded-tl-md border border-border bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60" />
          <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:150ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-muted-foreground/60 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export function ChatPage() {
  const [messages, setMessages] = useState<GraceChatMessage[]>(readConversation);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [showDisclosure, setShowDisclosure] = useState(() => !hasSeenDisclosure());
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [supportResources, setSupportResources] = useState<GraceSupportResource[]>(readSupportResources);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sendChat = useSendGraceChat();

  const getChatErrorMessage = (error: unknown) => {
    if (
      typeof error === 'object' &&
      error !== null &&
      'data' in error &&
      typeof error.data === 'object' &&
      error.data !== null &&
      'error' in error.data &&
      typeof error.data.error === 'string'
    ) {
      return error.data.error;
    }
    return "I can't reach my words right now - please try again in a moment.";
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sendChat.isPending]);

  useEffect(() => {
    const prompt = readOpeningPrompt();
    if (!prompt || messages.length > 0) return;

    const seededMessages: GraceChatMessage[] = [{ role: 'assistant', content: prompt }];
    setMessages(seededMessages);
    persistConversation(seededMessages);

    const url = new URL(window.location.href);
    url.searchParams.delete('prompt');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, [messages.length]);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const message = input.trim();
    if (!message || sendChat.isPending || showDisclosure) return;
    const outgoing: GraceChatMessage = { role: 'user', content: message };
    const nextMessages = [...messages, outgoing];
    setMessages(nextMessages);
    persistConversation(nextMessages);
    setInput('');
    setError('');

    sendChat.mutate(
      { data: { message, history: messages.slice(-20) } },
      {
        onSuccess: (response) => {
          const incoming: GraceChatMessage = { role: 'assistant', content: response.reply };
          setMessages((current) => {
            const updated = [...current, incoming];
            persistConversation(updated);
            return updated;
          });
          if (response.crisisSupport) {
            setSupportResources(response.supportResources);
            try {
              window.localStorage.setItem(SUPPORT_STORAGE_KEY, JSON.stringify(response.supportResources));
            } catch {
              // The support panel remains available for this session.
            }
          }
        },
        onError: (requestError) => {
          setError(getChatErrorMessage(requestError));
        },
      },
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const requestClearConversation = () => {
    if (messages.length === 0) return;
    setShowClearConfirmation(true);
  };

  const confirmClearConversation = () => {
    setMessages([]);
    setError('');
    setSupportResources([]);
    setShowClearConfirmation(false);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(SUPPORT_STORAGE_KEY);
  };

  const acknowledgeDisclosure = () => {
    try {
      window.localStorage.setItem(DISCLOSURE_STORAGE_KEY, 'true');
    } catch {
      // Keep the card dismissed for this session if storage is unavailable.
    }
    setShowDisclosure(false);
  };

  const promptWith = (value: string) => {
    setInput(value);
    window.setTimeout(() => document.getElementById('grace-message-input')?.focus(), 0);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-5xl flex-col px-5 py-8 md:px-12 md:py-12 xl:px-20">
      <div className="flex items-start justify-between gap-5 grace-rise">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"><span className="size-1.5 rounded-full bg-accent" /> private conversation</div>
          <h1 className="mt-4 font-serif text-5xl tracking-[-0.055em] text-primary md:text-7xl">Talk with Rose.</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground md:text-base">Bring the unpolished thought. You don’t have to make it make sense first.</p>
        </div>
        <button type="button" onClick={requestClearConversation} data-testid="button-clear-conversation" className="group flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <RotateCcw className="size-3.5 transition-transform group-hover:-rotate-45" /> <span className="hidden sm:inline">Clear conversation</span><span className="sm:hidden">Clear</span>
        </button>
      </div>

      {showClearConfirmation && (
        <div role="alertdialog" aria-labelledby="clear-conversation-title" className="mt-4 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3.5 md:flex md:items-center md:justify-between md:gap-5" data-testid="dialog-clear-conversation">
          <div>
            <p id="clear-conversation-title" className="text-sm font-semibold text-foreground">A fresh start can be kind.</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">Would you like to clear this conversation from this device? It cannot be recovered.</p>
          </div>
          <div className="mt-3 flex shrink-0 gap-2 md:mt-0">
            <button type="button" onClick={() => setShowClearConfirmation(false)} data-testid="button-cancel-clear-conversation" className="rounded-xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-secondary">Keep it</button>
            <button type="button" onClick={confirmClearConversation} data-testid="button-confirm-clear-conversation" className="rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90">Clear it</button>
          </div>
        </div>
      )}

      <div className="mt-10 flex h-[calc(100dvh-7.5rem)] max-h-[calc(100dvh-7.5rem)] min-h-0 flex-1 flex-col overflow-hidden rounded-[30px] border border-border bg-card shadow-sm grace-rise grace-rise-delay-2 md:mt-14">
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-4 md:px-7">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground"><Heart className="size-4 fill-current" /></div>
            <div><p className="text-sm font-semibold">rose.ai</p><p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-[hsl(var(--chart-5))]" /> here with you</p></div>
          </div>
          <div className="flex max-w-[280px] items-center justify-end gap-2 text-right text-[11px] leading-4 text-muted-foreground"><span className="hidden sm:inline">Nothing here is tied to an account. Your messages are sent to an AI service to write a reply.</span><ChevronDown className="size-4 shrink-0" /></div>
        </div>

        <div className="grace-scrollbar flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-7 md:px-9 md:py-9">
          {messages.length === 0 ? (
            <div className="m-auto max-w-lg text-center grace-rise">
              <div className="mx-auto flex size-14 items-center justify-center rounded-[20px] bg-secondary text-primary"><Sparkles className="size-6" strokeWidth={1.5} /></div>
              <h2 className="mt-6 font-serif text-3xl tracking-[-0.04em]">What’s sitting with you?</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Start wherever you are. Grace will meet you there, with curiosity instead of a checklist.</p>
              <div className="mt-7 flex flex-wrap justify-center gap-2">
                {['I feel a little overwhelmed', 'Help me find a kinder response', 'I want to celebrate something'].map((prompt) => (
                  <button type="button" key={prompt} onClick={() => promptWith(prompt)} data-testid={`button-prompt-${prompt.slice(0, 10).replace(/\s/g, '-').toLowerCase()}`} className="rounded-full border border-border bg-background px-3.5 py-2 text-xs text-muted-foreground transition-colors hover:border-accent hover:bg-secondary hover:text-foreground">{prompt}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div key={`${message.role}-${index}`} data-testid={`message-${message.role}-${index}`} className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                {message.role === 'assistant' && <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary"><Heart className="size-3.5 fill-current" /></div>}
                <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-sm leading-6 md:max-w-[70%] ${message.role === 'user' ? 'rounded-tr-md bg-primary text-primary-foreground' : 'rounded-tl-md border border-border bg-background text-foreground'}`}>{message.content}</div>
              </div>
            ))
          )}
          {sendChat.isPending && <TypingMessage />}
          {error && (
            <div className="flex items-start gap-3" data-testid="status-chat-error">
              <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-accent/25 text-foreground"><Sparkles className="size-3.5" /></div>
              <div className="rounded-2xl rounded-tl-md border border-accent/40 bg-accent/10 px-5 py-3.5 text-sm leading-6 text-foreground">{error}</div>
            </div>
          )}
           {supportResources.length > 0 && (
             <div className="rounded-2xl border border-accent/40 bg-accent/10 px-5 py-4" data-testid="status-crisis-support">
               <p className="text-sm font-semibold text-foreground">A little more support may help right now.</p>
               <p className="mt-1 text-sm leading-6 text-muted-foreground">You deserve support from a person who can be with you directly.</p>
               <div className="mt-4 space-y-3">
                 {supportResources.map((resource) => (
                   <div key={resource.label} className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
                     <p className="text-sm font-semibold text-foreground">{resource.label}</p>
                     <p className="mt-1 text-xs leading-5 text-muted-foreground">{resource.detail}</p>
                     <p className="mt-1 text-xs font-medium text-foreground">{resource.phone}</p>
                   </div>
                 ))}
               </div>
             </div>
           )}
          <div ref={bottomRef} />
        </div>

         {showDisclosure && (
           <div className="border-t border-border/80 bg-background/40 px-4 pt-4 md:px-5 md:pt-5">
             <div className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3.5" data-testid="status-first-run-disclosure">
               <div className="space-y-1 text-sm leading-5 text-foreground">
                 <p>Grace is an AI, not a person.</p>
                 <p>This is not therapy or professional advice.</p>
                 <p>Messages are sent to an AI service to write a reply and are not tied to an account.</p>
               </div>
               <button type="button" onClick={acknowledgeDisclosure} className="mt-3 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:opacity-90">I understand</button>
             </div>
           </div>
         )}
        <div className="sticky bottom-0 z-20 border-t border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 p-4 md:p-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <form onSubmit={submit} className="relative">
            <textarea
              id="grace-message-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
               disabled={showDisclosure || sendChat.isPending}
              maxLength={4000}
              rows={2}
              data-testid="input-grace-message"
              placeholder="Write what’s true right now..."
              className="w-full resize-none rounded-2xl border border-border bg-card py-4 pl-4 pr-14 text-sm leading-6 outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60"
            />
             <button type="submit" disabled={!input.trim() || showDisclosure || sendChat.isPending} data-testid="button-send-message" aria-label="Send message" className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-all hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-35">
              {sendChat.isPending ? <LoaderCircle className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            </button>
          </form>
          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-muted-foreground"><span>Press Enter to send · Shift + Enter for a new line</span><span>{input.length}/4000</span></div>
        </div>
      </div>

      <p className="mx-auto mt-5 flex items-center gap-2 text-center text-[11px] text-muted-foreground grace-rise grace-rise-delay-3"><Check className="size-3.5 text-[hsl(var(--chart-5))]" /> A gentle space, not professional advice.</p>
    </div>
  );
}