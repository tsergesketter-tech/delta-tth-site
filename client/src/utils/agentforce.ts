export interface AgentforceDisplayMessage {
  id: string;
  role: "user" | "assistant" | "tool" | "system" | string;
  text: string;
  createdAt?: string;
}

export interface AgentforceStreamHandlers {
  onDelta?: (delta: string, fullText: string, payload: any) => void;
  onEvent?: (event: { event?: string; data: string; payload: any }) => void;
  onComplete?: (details: { fullText: string }) => void;
}

const DEFAULT_ASSISTANT_ID =
  typeof window !== "undefined"
    ? (window as any).__AGENTFORCE_ASSISTANT_ID__ || undefined
    : undefined;

const ENV_INSTANCE_ENDPOINT =
  typeof process !== "undefined" && typeof process.env !== "undefined"
    ? (process.env as Record<string, string | undefined>)[
        "REACT_APP_AGENTFORCE_INSTANCE_URL"
      ]
    : undefined;

const DEFAULT_INSTANCE_ENDPOINT =
  typeof window !== "undefined" && (window as any).__AGENTFORCE_INSTANCE_URL__
    ? (window as any).__AGENTFORCE_INSTANCE_URL__
    : ENV_INSTANCE_ENDPOINT;

const FALLBACK_INSTANCE_ENDPOINT = "https://deltaloyalty-demo.my.salesforce.com";

type AgentforceSessionPayloadOverrides = {
  externalSessionKey?: string;
  instanceConfig?: { endpoint: string };
  streamingCapabilities?: { chunkTypes: string[] };
  bypassUser?: boolean;
  [key: string]: unknown;
};

export async function createAgentforceSession(options?: {
  assistantId?: string;
  sessionPayload?: AgentforceSessionPayloadOverrides;
}) {
  const assistantId = options?.assistantId || DEFAULT_ASSISTANT_ID;
  const payload = buildSessionPayload(options?.sessionPayload);

  const response = await fetch("/api/agentforce/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ assistantId, payload }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Agentforce session failed: ${response.status} ${response.statusText} ${text}`.trim()
    );
  }

  return response.json();
}

function buildSessionPayload(overrides?: AgentforceSessionPayloadOverrides) {
  const basePayload: AgentforceSessionPayloadOverrides = {
    externalSessionKey: cryptoRandomId(),
    streamingCapabilities: {
      chunkTypes: ["Text"],
    },
    bypassUser: false,
  };

  if (DEFAULT_INSTANCE_ENDPOINT) {
    basePayload.instanceConfig = { endpoint: DEFAULT_INSTANCE_ENDPOINT };
  } else {
    basePayload.instanceConfig = { endpoint: FALLBACK_INSTANCE_ENDPOINT };
  }

  if (!overrides) {
    return basePayload;
  }

  const merged: AgentforceSessionPayloadOverrides = {
    ...basePayload,
    ...overrides,
  };

  if (overrides.instanceConfig === undefined && basePayload.instanceConfig) {
    merged.instanceConfig = basePayload.instanceConfig;
  }

  if (overrides.streamingCapabilities === undefined) {
    merged.streamingCapabilities = basePayload.streamingCapabilities;
  }

  if (overrides.bypassUser === undefined) {
    merged.bypassUser = basePayload.bypassUser;
  }

  if (overrides.externalSessionKey === undefined) {
    merged.externalSessionKey = basePayload.externalSessionKey;
  }

  return merged;
}

export async function sendAgentforceMessage(
  sessionId: string,
  message: string,
  options?: {
    assistantId?: string;
    metadata?: Record<string, unknown>;
    sequenceId?: number;
  }
) {
  const assistantId = options?.assistantId || DEFAULT_ASSISTANT_ID;
  const sequenceId = options?.sequenceId ?? 1;

  const bodyPayload = {
    assistantId,
    payload: {
      message: {
        sequenceId,
        type: "Text",
        text: message,
        metadata: options?.metadata,
      },
    },
  };

  const response = await fetch(`/api/agentforce/session/${encodeURIComponent(sessionId)}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Agentforce message failed: ${response.status} ${response.statusText} ${text}`.trim()
    );
  }

  return response.json();
}

export async function streamAgentforceMessage(
  sessionId: string,
  message: string,
  options?: {
    assistantId?: string;
    metadata?: Record<string, unknown>;
    signal?: AbortSignal;
    handlers?: AgentforceStreamHandlers;
    sequenceId?: number;
  }
) {
  const assistantId = options?.assistantId || DEFAULT_ASSISTANT_ID;
  const sequenceId = options?.sequenceId ?? 1;

  const bodyPayload = {
    assistantId,
    payload: {
      message: {
        sequenceId,
        type: "Text",
        text: message,
        metadata: options?.metadata,
      },
    },
  };

  const response = await fetch(`/api/agentforce/session/${encodeURIComponent(sessionId)}/messages/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(bodyPayload),
    signal: options?.signal,
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Agentforce stream failed: ${response.status} ${response.statusText} ${text}`.trim()
    );
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullText = "";

  const release = async () => {
    try {
      await reader.cancel();
    } catch (_err) {
      /* noop */
    }
  };

  if (options?.signal) {
    if (options.signal.aborted) {
      await release();
      throw new DOMException("Aborted", "AbortError");
    }
    options.signal.addEventListener(
      "abort",
      () => {
        void release();
      },
      { once: true }
    );
  }

  const handlers = options?.handlers;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex = buffer.indexOf("\n\n");
    while (separatorIndex >= 0) {
      const rawEvent = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      separatorIndex = buffer.indexOf("\n\n");

      const parsed = parseSseEvent(rawEvent);
      if (!parsed) {
        continue;
      }

      let payload: any = parsed.data;
      if (typeof parsed.data === "string") {
        try {
          payload = JSON.parse(parsed.data);
        } catch (_err) {
          payload = parsed.data;
        }
      }

      handlers?.onEvent?.({ event: parsed.event, data: parsed.data, payload });

      if (typeof payload === "string" && payload.trim() === "[DONE]") {
        handlers?.onComplete?.({ fullText });
        return { fullText };
      }

      const { delta, done, appendText } = interpretStreamingPayload(payload, fullText);

      if (delta) {
        fullText += delta;
        handlers?.onDelta?.(delta, fullText, payload);
      }

      if (appendText && !delta) {
        const addition = appendText.startsWith(fullText)
          ? appendText.slice(fullText.length)
          : appendText;
        if (addition) {
          fullText += addition;
          handlers?.onDelta?.(addition, fullText, payload);
        }
      }

      if (done) {
        handlers?.onComplete?.({ fullText });
        return { fullText };
      }
    }
  }

  const trailing = decoder.decode();
  if (trailing) {
    buffer += trailing;
  }

  if (buffer.trim()) {
    const parsed = parseSseEvent(buffer.trim());
    if (parsed?.data === "[DONE]" || parsed?.event === "end") {
      handlers?.onComplete?.({ fullText });
      return { fullText };
    }
  }

  handlers?.onComplete?.({ fullText });
  return { fullText };
}

export function extractMessagesFromResponse(payload: any): AgentforceDisplayMessage[] {
  if (!payload) return [];

  const buckets: AgentforceDisplayMessage[] = [];

  const primitivesToMessages = (messages: any[]) => {
    if (!Array.isArray(messages)) return;
    for (const raw of messages) {
      const role = raw?.role || raw?.sender || raw?.participant || "assistant";
      const id = String(
        raw?.id || raw?.messageId || raw?.sid || raw?.sequence || cryptoRandomId()
      );
      const createdAt = raw?.createdAt || raw?.timestamp || undefined;
      const text = normaliseMessageContent(raw);
      if (text) {
        buckets.push({ id, role, text, createdAt });
      }
    }
  };

  if (Array.isArray(payload?.messages)) {
    primitivesToMessages(payload.messages);
  }

  if (Array.isArray(payload?.session?.messages)) {
    primitivesToMessages(payload.session.messages);
  }

  if (Array.isArray(payload?.outputs)) {
    primitivesToMessages(payload.outputs);
  }

  if (Array.isArray(payload?.assistantMessages)) {
    primitivesToMessages(payload.assistantMessages);
  }

  if (buckets.length === 0 && typeof payload === "object") {
    const maybeSingle = normaliseMessageContent(payload);
    if (maybeSingle) {
      buckets.push({
        id: cryptoRandomId(),
        role: payload?.role || "assistant",
        text: maybeSingle,
        createdAt: payload?.createdAt,
      });
    }
  }

  return buckets;
}

function normaliseMessageContent(message: any): string {
  if (!message) return "";

  if (typeof message === "string") return message;

  if (Array.isArray(message)) {
    return message.map(normaliseMessageContent).filter(Boolean).join("\n\n");
  }

  if (typeof message.text === "string") {
    return message.text;
  }

  if (typeof message.message === "string") {
    return message.message;
  }

  if (message?.content) {
    if (Array.isArray(message.content)) {
      const textBlocks = message.content
        .map((block: any) => {
          if (!block) return "";
          if (typeof block === "string") return block;
          if (block?.type === "text" && typeof block.text === "string") {
            return block.text;
          }
          if (block?.type === "toolCall" && block?.toolInput) {
            return JSON.stringify(block.toolInput);
          }
          if (block?.type === "response" && block?.responseText) {
            return block.responseText;
          }
          if (block?.text) return String(block.text);
          if (block?.value) return typeof block.value === "string" ? block.value : JSON.stringify(block.value);
          return "";
        })
        .filter(Boolean);
      if (textBlocks.length) {
        return textBlocks.join("\n\n");
      }
    }

    if (typeof message.content === "string") {
      return message.content;
    }
    if (typeof message.content?.text === "string") {
      return message.content.text;
    }
  }

  if (typeof message.response === "string") {
    return message.response;
  }

  if (typeof message.answer === "string") {
    return message.answer;
  }

  if (typeof message?.summary === "string") {
    return message.summary;
  }

  if (message?.metadata?.summary) {
    return String(message.metadata.summary);
  }

  return "";
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return (crypto as any).randomUUID();
  }
  return Math.random().toString(36).substring(2, 12);
}

function parseSseEvent(block: string):
  | {
      event?: string;
      data: string;
      id?: string;
    }
  | null {
  if (!block) {
    return null;
  }

  const lines = block.split("\n");
  let event: string | undefined;
  let data: string[] = [];
  let id: string | undefined;

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line || line.startsWith(":")) {
      continue;
    }
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data.push(line.slice(5));
    } else if (line.startsWith("id:")) {
      id = line.slice(3).trim();
    }
  }

  const dataString = data.map((entry) => entry.trimStart()).join("\n");

  return {
    event,
    data: dataString,
    id,
  };
}

function interpretStreamingPayload(payload: any, currentText: string): {
  delta?: string;
  appendText?: string;
  done?: boolean;
} {
  if (!payload) {
    return {};
  }

  const messageType = payload?.message?.type;

  if (messageType === "EndOfTurn" || messageType === "EndOfResponse") {
    return { done: true };
  }

  if (messageType === "ProgressIndicator" || messageType === "Start") {
    return {};
  }

  if (messageType === "TextChunk") {
    const chunk =
      payload?.message?.message ?? payload?.message?.text ?? payload?.message?.delta;
    if (typeof chunk === "string" && chunk.length > 0) {
      return { delta: chunk };
    }
    return {};
  }

  if (Array.isArray(payload?.messages)) {
    const combined = payload.messages
      .map((entry: any) => entry?.message ?? entry?.text ?? "")
      .filter(Boolean)
      .join("\n\n");

    if (combined) {
      const addition = combined.startsWith(currentText)
        ? combined.slice(currentText.length)
        : combined;
      return {
        delta: addition,
        appendText: combined,
        done: payload.messages.some((entry: any) => entry?.type === "Inform"),
      };
    }
    return {};
  }

  const candidate = normaliseMessageContent(payload);
  if (candidate) {
    const addition = candidate.startsWith(currentText)
      ? candidate.slice(currentText.length)
      : candidate;
    return { delta: addition };
  }

  return {};
}
