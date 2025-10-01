import { Router } from "express";
import { Readable } from "stream";
import { sfFetch } from "../salesforce/sfFetch";
import { getClientCredentialsToken } from "../salesforce/auth";

const DEFAULT_EINSTEIN_BASE = "https://api.salesforce.com/einstein/ai-agent/v1";
const CONFIGURED_EINSTEIN_BASE = (process.env.SF_AGENTFORCE_BASE_URL ?? "").trim();
const EINSTEIN_BASE = (CONFIGURED_EINSTEIN_BASE || DEFAULT_EINSTEIN_BASE).replace(/\/$/, "");
const SHOULD_USE_EINSTEIN =
  CONFIGURED_EINSTEIN_BASE.length > 0 ||
  process.env.SF_AGENTFORCE_DISABLE_DEFAULT !== "true";

type AgentforceRequestInit = RequestInit & { streaming?: boolean };

function normaliseHeaders(input?: HeadersInit): Record<string, string> {
  if (!input) return {};
  if (Array.isArray(input)) {
    return Object.fromEntries(input);
  }
  if (input instanceof Headers) {
    return Object.fromEntries(input.entries());
  }
  return { ...input } as Record<string, string>;
}

async function fetchAgentforce({
  einsteinPath,
  sfPath,
  init = {},
}: {
  einsteinPath: string;
  sfPath: string;
  init?: AgentforceRequestInit;
}) {
  const headers = normaliseHeaders(init?.headers);
  const streaming = Boolean(init?.streaming);

  if (SHOULD_USE_EINSTEIN) {
    const { access_token } = await getClientCredentialsToken();
    const einsteinResponse = await fetch(`${EINSTEIN_BASE}${einsteinPath}`, {
      ...init,
      headers: {
        ...headers,
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (CONFIGURED_EINSTEIN_BASE.length > 0 || einsteinResponse.status !== 404) {
      return einsteinResponse;
    }
  }

  const response = await sfFetch(sfPath, {
    ...init,
    headers,
  });

  if (!streaming && response.status === 404) {
    console.warn(`[agentforce] 404 from ${sfPath}`);
  }

  return response;
}

const router = Router();

router.post("/session", async (req, res) => {
  try {
    const assistantId =
      req.body?.assistantId || process.env.SF_AGENTFORCE_ASSISTANT_ID;

    if (!assistantId) {
      return res.status(400).json({
        error: "Missing assistant id",
        details: "Provide assistantId in request body or set SF_AGENTFORCE_ASSISTANT_ID",
      });
    }

    const payload = JSON.stringify(req.body?.payload || {});
    const apiVersion = process.env.SF_AGENTFORCE_API_VERSION || "v64.0";
    const einsteinPath = `/agents/${assistantId}/sessions`;
    const sfPath = `/services/data/${apiVersion}/agentforce/assistants/${assistantId}/sessions`;

    const response = await fetchAgentforce({
      einsteinPath,
      sfPath,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
      },
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("[agentforce/session] Error", response.status, text);
      return res.status(response.status).json({
        error: "Failed to create Agentforce session",
        details: safeJsonParse(text),
        status: response.status,
      });
    }

    return res.status(200).json(safeJsonParse(text));
  } catch (err: any) {
    console.error("[agentforce/session] Unexpected error", err);
    return res.status(500).json({
      error: "Unexpected server error creating Agentforce session",
      message: err?.message || String(err),
    });
  }
});

router.post("/session/:sessionId/messages", async (req, res) => {
  try {
    const assistantId =
      req.body?.assistantId || process.env.SF_AGENTFORCE_ASSISTANT_ID;
    const { sessionId } = req.params;

    if (!assistantId) {
      return res.status(400).json({
        error: "Missing assistant id",
        details: "Provide assistantId in request body or set SF_AGENTFORCE_ASSISTANT_ID",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        error: "Missing session id",
      });
    }

    const payload = JSON.stringify(req.body?.payload || {});
    const apiVersion = process.env.SF_AGENTFORCE_API_VERSION || "v64.0";
    const einsteinPath = `/sessions/${sessionId}/messages`;
    const sfPath = `/services/data/${apiVersion}/agentforce/assistants/${assistantId}/sessions/${sessionId}/messages`;

    const response = await fetchAgentforce({
      einsteinPath,
      sfPath,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: payload,
      },
    });

    const text = await response.text();
    if (!response.ok) {
      console.error("[agentforce/messages] Error", response.status, text);
      return res.status(response.status).json({
        error: "Failed to send Agentforce message",
        details: safeJsonParse(text),
        status: response.status,
      });
    }

    return res.status(200).json(safeJsonParse(text));
  } catch (err: any) {
    console.error("[agentforce/messages] Unexpected error", err);
    return res.status(500).json({
      error: "Unexpected server error sending Agentforce message",
      message: err?.message || String(err),
    });
  }
});

router.post("/session/:sessionId/messages/stream", async (req, res) => {
  try {
    const assistantId =
      req.body?.assistantId || process.env.SF_AGENTFORCE_ASSISTANT_ID;
    const { sessionId } = req.params;

    if (!assistantId) {
      return res.status(400).json({
        error: "Missing assistant id",
        details: "Provide assistantId in request body or set SF_AGENTFORCE_ASSISTANT_ID",
      });
    }

    if (!sessionId) {
      return res.status(400).json({
        error: "Missing session id",
      });
    }

    const payload = JSON.stringify(req.body?.payload || {});
    const apiVersion = process.env.SF_AGENTFORCE_API_VERSION || "v64.0";
    const einsteinPath = `/sessions/${sessionId}/messages/stream`;
    const sfPath = `/services/data/${apiVersion}/agentforce/assistants/${assistantId}/sessions/${sessionId}/messages:stream`;

    const response = await fetchAgentforce({
      einsteinPath,
      sfPath,
      init: {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: payload,
        streaming: true,
      },
    });

    if (!response.ok || !response.body) {
      const text = await response.text().catch(() => "");
      console.error("[agentforce/messages/stream] Error", response.status, text);
      return res.status(response.status).json({
        error: "Failed to stream Agentforce message",
        details: safeJsonParse(text),
        status: response.status,
      });
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    if (typeof (res as any).flushHeaders === "function") {
      (res as any).flushHeaders();
    }

    const stream = Readable.fromWeb(response.body as any);

    const abort = () => {
      stream.destroy();
      res.end();
    };

    req.on("close", abort);
    req.on("aborted", abort);

    stream.on("error", (err) => {
      console.error("[agentforce/messages/stream] Upstream error", err);
      abort();
    });

    for await (const chunk of stream) {
      res.write(chunk);
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
    }

    res.end();
  } catch (err: any) {
    console.error("[agentforce/messages/stream] Unexpected error", err);
    return res.status(500).json({
      error: "Unexpected server error streaming Agentforce message",
      message: err?.message || String(err),
    });
  }
});

function safeJsonParse(text: string) {
  try {
    return text ? JSON.parse(text) : {};
  } catch (_err) {
    return { raw: text };
  }
}

export default router;
