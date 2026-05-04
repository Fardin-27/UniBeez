// Admin & Feedback module
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

const objectIdPattern = /^[a-fA-F0-9]{24}$/;

const extractObjectId = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return objectIdPattern.test(trimmed) ? trimmed : null;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return (
      extractObjectId(record._id) ||
      extractObjectId(record.$oid) ||
      extractObjectId(record.id)
    );
  }

  return null;
};

const isValidObjectId = (id: string | null | undefined) => !!extractObjectId(id);

type ConversationSummary = {
  _id: string;
  contextType: "product" | "service" | "general";
  unreadCount: number;
  lastMessageAt: string;
  otherParticipant?: {
    _id: string;
    fullName?: string;
    username?: string;
  };
  latestMessage?: {
    body: string;
    createdAt: string;
  };
};

type ConversationDetails = {
  _id: string;
  messages: Array<{
    _id: string;
    body: string;
    createdAt: string;
    sender:
      | string
      | {
          _id: string;
          fullName?: string;
          username?: string;
        };
  }>;
};

type ConversationMessage = ConversationDetails["messages"][number];

const normalizeParticipant = (
  participant: unknown
): ConversationSummary["otherParticipant"] => {
  const participantId = extractObjectId(participant);
  if (!participantId) return undefined;

  if (!participant || typeof participant !== "object") {
    return { _id: participantId };
  }

  const value = participant as Record<string, unknown>;
  return {
    _id: participantId,
    fullName: typeof value.fullName === "string" ? value.fullName : undefined,
    username: typeof value.username === "string" ? value.username : undefined,
  };
};

const normalizeLatestMessage = (
  message: unknown,
  fallbackDate: unknown
): ConversationSummary["latestMessage"] => {
  if (!message || typeof message !== "object") return undefined;

  const value = message as Record<string, unknown>;
  return {
    body: typeof value.body === "string" ? value.body : "",
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : typeof fallbackDate === "string"
          ? fallbackDate
          : new Date().toISOString(),
  };
};

const normalizeConversationSummary = (
  conversation: unknown
): ConversationSummary | null => {
  if (!conversation || typeof conversation !== "object") return null;

  const value = conversation as Record<string, unknown>;
  const conversationId = extractObjectId(value._id);
  if (!conversationId) return null;

  const contextType =
    value.contextType === "product" || value.contextType === "service"
      ? value.contextType
      : "general";

  return {
    _id: conversationId,
    contextType,
    unreadCount:
      typeof value.unreadCount === "number" ? value.unreadCount : 0,
    lastMessageAt:
      typeof value.lastMessageAt === "string"
        ? value.lastMessageAt
        : new Date().toISOString(),
    otherParticipant: normalizeParticipant(value.otherParticipant),
    latestMessage: normalizeLatestMessage(value.latestMessage, value.lastMessageAt),
  };
};

const normalizeMessageSender = (
  sender: unknown
): ConversationMessage["sender"] => {
  const senderId = extractObjectId(sender);

  if (!sender || typeof sender !== "object") {
    return senderId || "";
  }

  const value = sender as Record<string, unknown>;
  return {
    _id: senderId || "",
    fullName: typeof value.fullName === "string" ? value.fullName : undefined,
    username: typeof value.username === "string" ? value.username : undefined,
  };
};

const normalizeConversationMessage = (
  message: unknown,
  index: number
): ConversationMessage | null => {
  if (!message || typeof message !== "object") return null;

  const value = message as Record<string, unknown>;
  const messageId = extractObjectId(value._id) || `message-${index}`;

  return {
    _id: messageId,
    body: typeof value.body === "string" ? value.body : "",
    createdAt:
      typeof value.createdAt === "string"
        ? value.createdAt
        : new Date().toISOString(),
    sender: normalizeMessageSender(value.sender),
  };
};

const normalizeConversationMessages = (
  messages: unknown
): ConversationMessage[] =>
  Array.isArray(messages)
    ? messages
        .map(normalizeConversationMessage)
        .filter((message): message is ConversationMessage => Boolean(message))
    : [];

const normalizeMessageError = (error: unknown, fallback: string) => {
  const message = error instanceof Error ? error.message : String(error || "");

  if (
    /24 character hex string|12 byte Uint8Array|CastError|Invalid ID|Invalid conversation id|Invalid message id/i.test(
      message
    )
  ) {
    return "Invalid conversation data. Please refresh and try again.";
  }

  return message || fallback;
};

const MessagesPage: React.FC = () => {
  const { API_URL, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ConversationDetails | null>(null);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const [deletingConversationId, setDeletingConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeSummary = useMemo(
    () => conversations.find((c) => c._id === activeConversationId),
    [conversations, activeConversationId]
  );
  const hasActiveConversation = isValidObjectId(activeConversationId);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        credentials: "include",
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Failed to load conversations");

      const rawConversations: unknown[] = Array.isArray(payload?.conversations)
        ? payload.conversations
        : [];
      const convs = rawConversations
        .map(normalizeConversationSummary)
        .filter(
          (conversation): conversation is ConversationSummary =>
            Boolean(conversation)
        );
      const nextActiveId =
        activeConversationId && convs.some((c) => c._id === activeConversationId)
          ? activeConversationId
          : convs[0]?._id || null;

      setConversations(convs);
      setActiveConversationId(nextActiveId);
      if (!nextActiveId) {
        setActiveConversation(null);
      }
      setError(
        rawConversations.length > 0 && convs.length === 0
          ? "Conversation data could not be loaded. Please refresh and try again."
          : null
      );
    } catch (err) {
      setError(normalizeMessageError(err, "Failed to load conversations"));
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    const validConversationId = extractObjectId(conversationId);
    if (!validConversationId) {
      setActiveConversation(null);
      setError("Invalid conversation selection. Please refresh your inbox.");
      return;
    }

    try {
      setMessagesLoading(true);
      setError(null);
      setActiveConversation(null);

      const response = await fetch(
        `${API_URL}/api/messages/conversations/${validConversationId}/messages`,
        { credentials: "include" }
      );

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Failed to load messages");
      
      const messages =
        payload.conversation?.messages ||
        payload.messages ||
        payload.data?.messages ||
        (Array.isArray(payload) ? payload : []);
      setActiveConversation({
        _id: validConversationId,
        messages: normalizeConversationMessages(messages),
      });
    } catch (err) {
      setError(normalizeMessageError(err, "Failed to load conversation"));
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    const validConversationId = extractObjectId(activeConversationId);
    if (!validConversationId || !messageBody.trim()) {
      if (!validConversationId) {
        setError("Invalid conversation selection. Please refresh your inbox.");
      }
      return;
    }

    try {
      setSending(true);
      const response = await fetch(
        `${API_URL}/api/messages/conversations/${validConversationId}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: messageBody.trim() }),
        }
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Failed to send message");

      const messages = normalizeConversationMessages(payload.conversation?.messages);
      const latest = messages[messages.length - 1];
      setMessageBody("");
      setActiveConversation((prev) =>
        prev
          ? { ...prev, _id: validConversationId, messages }
          : { _id: validConversationId, messages }
      );

      setConversations((prev) =>
        prev
          .map((item) =>
            item._id === validConversationId
              ? {
                  ...item,
                  latestMessage: latest
                    ? { body: latest.body, createdAt: latest.createdAt }
                    : item.latestMessage,
                  lastMessageAt: latest?.createdAt || new Date().toISOString(),
                }
              : item
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          )
      );
    } catch (err) {
      setError(normalizeMessageError(err, "Failed to send message"));
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    const validConversationId = extractObjectId(conversationId);
    if (!validConversationId) {
      setError("Invalid conversation selection. Please refresh your inbox.");
      return;
    }

    try {
      setDeletingConversationId(validConversationId);
      const response = await fetch(`${API_URL}/api/messages/conversations/${validConversationId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message || "Failed to delete conversation");

      setConversations((prev) => {
        const updated = prev.filter((item) => item._id !== validConversationId);

        if (activeConversationId === validConversationId) {
          const nextId = updated.length > 0 ? updated[0]._id : null;
          setActiveConversationId(nextId);
          setActiveConversation(null);
        }

        return updated;
      });

      setError(null);
    } catch (err) {
      setError(normalizeMessageError(err, "Failed to delete conversation"));
    } finally {
      setDeletingConversationId(null);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  if (loading) return <LoadingSpinner text="Loading messages..." />;

  return (
    <div className="max-w-full px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">Messages</h1>
        <p className="text-slate-500 mt-1">Chat with sellers and service providers before confirming transactions</p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 text-red-600 px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] border border-white/40 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100 font-semibold text-slate-700">
            Conversations
          </div>
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-slate-500">No conversations yet.</div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`px-4 py-3 hover:bg-slate-50 transition-colors ${
                    activeConversationId === conversation._id ? "bg-brand-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveConversationId(conversation._id)}
                      className="text-left flex-1"
                    >
                      <p className="font-semibold text-slate-800 text-sm">
                        {conversation.otherParticipant?.fullName ||
                          conversation.otherParticipant?.username ||
                          "Participant"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {conversation.latestMessage?.body || "No messages yet"}
                      </p>
                    </button>
                    <div className="flex items-center gap-2">
                      {conversation.unreadCount > 0 && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">
                          {conversation.unreadCount}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteConversation(conversation._id)}
                        disabled={deletingConversationId === conversation._id}
                        className="text-xs px-2 py-1 rounded-md border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 disabled:opacity-50"
                        title="Delete conversation"
                      >
                        {deletingConversationId === conversation._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-[2rem] border border-white/40 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-slate-100">
            <p className="font-semibold text-slate-700">
              {activeSummary?.otherParticipant?.fullName ||
                activeSummary?.otherParticipant?.username ||
                "Select a conversation"}
            </p>
          </div>

          <div className="p-4 h-[55vh] overflow-y-auto space-y-3 bg-slate-50/30">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <LoadingSpinner text="Loading messages..." />
              </div>
            ) : activeConversation?.messages?.length ? (
              activeConversation.messages.map((message) => {
                const senderId =
                  typeof message.sender === "string"
                    ? message.sender
                    : message.sender?._id;
                const mine = senderId === user?._id;
                return (
                  <div
                    key={message._id}
                    className={`flex ${mine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                        mine
                          ? "bg-brand-600 text-white"
                          : "bg-white border border-slate-200 text-slate-700"
                      }`}
                    >
                      <p>{message.body}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          mine ? "text-brand-100" : "text-slate-400"
                        }`}
                      >
                        {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-slate-500">No messages in this conversation yet.</p>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 flex gap-2">
            <input
              type="text"
              value={messageBody}
              onChange={(event) => setMessageBody(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Type your message..."
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={sendMessage}
              disabled={sending || !hasActiveConversation}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
