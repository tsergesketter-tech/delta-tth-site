import React, { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  createAgentforceSession,
  sendAgentforceMessage,
  streamAgentforceMessage,
  extractMessagesFromResponse,
  AgentforceDisplayMessage,
} from "../utils/agentforce";

function MessageBubble({ message }: { message: AgentforceDisplayMessage }) {
  const isAgent = message.role !== "user";
  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-xl rounded-2xl px-5 py-3 shadow-sm ${
          isAgent
            ? "bg-white border border-slate-200 text-slate-900"
            : "bg-red-600 text-white"
        }`}
      >
        <div className="leading-relaxed text-sm md:text-base">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              ul: ({ node, ...props }) => (
                <ul className="list-disc pl-5 space-y-1" {...props} />
              ),
              ol: ({ node, ...props }) => (
                <ol className="list-decimal pl-5 space-y-1" {...props} />
              ),
              li: ({ node, ...props }) => <li className="text-left" {...props} />,
              a: ({ node, ...props }) => (
                <a
                  className="underline decoration-red-500 decoration-2 underline-offset-2 hover:text-red-600"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                />
              ),
              img: ({ node, ...props }) => <MarkdownImage {...props} />,
              p: ({ node, ...props }) => (
                <p className="mb-3 last:mb-0 text-left" {...props} />
              ),
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
        <div
          className={`mt-2 text-xs uppercase tracking-wide ${
            isAgent ? "text-slate-500" : "text-red-100"
          }`}
        >
          {isAgent ? "Delta Digital Concierge" : "You"}
        </div>
      </div>
    </div>
  );
}

function MarkdownImage(
  props: React.ImgHTMLAttributes<HTMLImageElement> & { node?: unknown }
) {
  const { alt, src, node: _node, ...rest } = props;
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    if (!src) return null;

    return (
      <figure className="mt-4 space-y-2">
        <div className="rounded-lg border border-slate-200 bg-slate-100 p-4 text-xs text-slate-500">
          Image preview unavailable. This content may require authentication.
        </div>
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-600 hover:text-red-700"
        >
          Open image in new tab
        </a>
      </figure>
    );
  }

  return (
    <figure className="mt-4 space-y-2">
      <img
        {...rest}
        src={src}
        alt={alt || "Agent provided artwork"}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={
          "max-h-60 w-full rounded-lg border border-slate-200 object-cover shadow-sm"
        }
      />
      {alt ? (
        <figcaption className="text-xs uppercase tracking-wide text-slate-500">
          {alt}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function AgentAssist() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AgentforceDisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const streamingControllerRef = useRef<AbortController | null>(null);
  const sequenceCounterRef = useRef<number>(1);
  const scrollRegionRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      streamingControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const container = scrollRegionRef.current;
    const anchor = bottomRef.current;
    if (!container || !anchor) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const threshold = 96;

    if (distanceFromBottom <= threshold || messages.length <= 1) {
      anchor.scrollIntoView({ behavior: "auto", block: "end" });
    }
  }, [messages.length]);

  useEffect(() => {
    let cancelled = false;

    async function initSession() {
      setIsLoadingSession(true);
      setError(null);

      try {
        const response = await createAgentforceSession();
        if (cancelled) return;

        const sessionIdentifier =
          response.sessionId || response.id || response.session?.id;

        if (!sessionIdentifier) {
          throw new Error("Agentforce session id missing in response");
        }

        setSessionId(sessionIdentifier);
        sequenceCounterRef.current = 1;

        const initialMessages = extractMessagesFromResponse(response).filter(
          (m) => m.text.trim().length > 0
        );

        if (initialMessages.length > 0) {
          setMessages(initialMessages);
        }
      } catch (err: any) {
        console.error("Failed to create Agentforce session", err);
        if (!cancelled) {
          setError(
            err?.message ||
              "We couldn't reach the Delta digital concierge. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingSession(false);
        }
      }
    }

    void initSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const canSend = useMemo(
    () => Boolean(input.trim()) && Boolean(sessionId) && !isSending,
    [input, sessionId, isSending]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSend || !sessionId) {
      return;
    }

    const trimmed = input.trim();
    if (!trimmed) return;

    const optimisticMessage: AgentforceDisplayMessage = {
      id: `local-${Date.now()}`,
      role: "user",
      text: trimmed,
      createdAt: new Date().toISOString(),
    };

    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantPlaceholder: AgentforceDisplayMessage = {
      id: assistantMessageId,
      role: "assistant",
      text: "",
      createdAt: new Date().toISOString(),
    };

    const sequenceId = sequenceCounterRef.current;
    sequenceCounterRef.current += 1;

    const updateAssistantText = (text: string) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId ? { ...message, text } : message
        )
      );
    };

    setMessages((prev) => [...prev, optimisticMessage, assistantPlaceholder]);
    setInput("");
    setIsSending(true);
    setError(null);

    const controller = new AbortController();
    streamingControllerRef.current?.abort();
    streamingControllerRef.current = controller;

    let latestFullText = "";
    let receivedAnyDelta = false;

    try {
      const result = await streamAgentforceMessage(sessionId, trimmed, {
        signal: controller.signal,
        sequenceId,
        handlers: {
          onDelta: (_delta, fullText) => {
            receivedAnyDelta = true;
            latestFullText = fullText;
            updateAssistantText(fullText);
          },
          onComplete: ({ fullText }) => {
            latestFullText = fullText;
          },
        },
      });

      latestFullText = result?.fullText ?? latestFullText;

      if (latestFullText.trim().length === 0) {
        updateAssistantText(
          "The agent didn't send a message this time. Please try again."
        );
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        return;
      }

      streamingControllerRef.current = null;
      console.error("Agentforce streaming failed", err);

      if (!receivedAnyDelta) {
        try {
          const response = await sendAgentforceMessage(sessionId, trimmed, {
            sequenceId,
          });
          const assistantMessages = extractMessagesFromResponse(response).filter(
            (m) => m.role !== "user" && m.text.trim().length > 0
          );

          if (assistantMessages.length > 0) {
            const [first, ...rest] = assistantMessages;
            updateAssistantText(first.text);
            latestFullText = first.text;

            if (rest.length > 0) {
              setMessages((prev) => [...prev, ...rest]);
            }
          } else {
            throw new Error("No assistant response returned");
          }
        } catch (fallbackErr: any) {
          console.error("Agentforce fallback send failed", fallbackErr);
          updateAssistantText(
            "We couldn't retrieve a response. Please try again shortly."
          );
          setError(
            fallbackErr?.message ||
              err?.message ||
              "We ran into an issue reaching the agent. Please try again shortly."
          );
        }
      } else {
        setError(
          "The agent connection was interrupted. The response may be incomplete."
        );
      }

      return;
    } finally {
      streamingControllerRef.current = null;
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-sm font-semibold tracking-widest text-sky-300 uppercase">
            SkyMiles Digital Concierge
          </p>
          <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">
                Speak with a Delta Agent
              </h1>
              <p className="mt-3 max-w-2xl text-base text-slate-200">
                Get real-time help with SkyMiles status, upcoming trips, and
                day-of-travel support through our Agentforce-powered concierge.
              </p>
            </div>
            <img
              src="/images/delta_logo_sideways.png"
              alt="Delta wing logo"
              className="h-16 w-auto self-start opacity-80 md:self-center"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-12 max-w-6xl px-6">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-xl">
          <div className="flex flex-col gap-0 p-6 md:p-8" style={{ minHeight: "560px" }}>
            <header className="border-b border-slate-100 pb-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Delta Digital Concierge
                  </h2>
                  <p className="text-sm text-slate-500">
                    {isLoadingSession
                      ? "Connecting to Agentforce..."
                      : sessionId
                      ? "Connected via Salesforce Agentforce"
                      : "Not connected"}
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
                  <span>
                    {isLoadingSession
                      ? "Establishing secure session"
                      : sessionId
                      ? "Agent online"
                      : "Agent offline"}
                  </span>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-hidden">
              <div
                ref={scrollRegionRef}
                className="flex h-full flex-col gap-4 overflow-y-auto rounded-2xl bg-slate-50/60 p-4 md:p-6"
              >
                {messages.length === 0 && !isLoadingSession ? (
                  <div className="flex h-full items-center justify-center text-center text-slate-500">
                    <div>
                      <p className="text-lg font-medium">
                        Ask anything about your SkyMiles world.
                      </p>
                      <p className="mt-2 text-sm">
                        Flight changes, Medallion upgrades, day-of-travel
                        tips, and more—the concierge has you covered.
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )}
                {isSending ? (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 shadow-sm">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-75" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 delay-150" />
                      <span className="uppercase tracking-wide">Typing</span>
                    </div>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 flex flex-col gap-3 rounded-2xl bg-slate-900/5 p-4 md:flex-row md:items-center"
            >
              <label htmlFor="agent-message" className="sr-only">
                Message the Delta agent
              </label>
              <input
                id="agent-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about SkyMiles perks, flight changes, or day-of-travel support"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-sm focus:border-red-500 focus:outline-none focus:ring focus:ring-red-100"
                disabled={!sessionId || isSending || isLoadingSession}
              />
              <button
                type="submit"
                disabled={!canSend}
                className={`inline-flex items-center justify-center rounded-xl bg-red-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                  canSend ? "" : "opacity-60 cursor-not-allowed"
                }`}
              >
                Send Message
              </button>
            </form>

            {error ? (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
