"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function MapleChat() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "메이플 관련해 무엇이든 물어보세요 :)" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text: string) => {
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/maple-chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: [...messages, { role: "user", content: text }] }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer || "응답 없음" }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "서버 오류가 발생했어요. 잠시 후 다시 시도해주세요." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const ask = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    send(text);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask();
    }
  };

  const panel: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: '#242830',
    color: '#e2e4e8',
  };

  const header: React.CSSProperties = {
    padding: "20px 24px 12px",
    fontWeight: 700,
    fontSize: '22px',
    color: '#fff',
    borderBottom: "1px solid #353941",
  };

  const body: React.CSSProperties = {
    padding: "12px 16px",
    flex: 1,
    overflowY: "auto",
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  };

  const bubbleUser: React.CSSProperties = {
    marginLeft: "auto",
    maxWidth: "85%",
    borderRadius: 16,
    padding: "10px 14px",
    background: "#316fea",
    color: "#fff",
    whiteSpace: "pre-wrap",
    wordBreak: 'break-word',
  };

  const bubbleBot: React.CSSProperties = {
    marginRight: "auto",
    maxWidth: "85%",
    borderRadius: 16,
    padding: "10px 14px",
    background: "#2d313a",
    color: "#e2e4e8",
    whiteSpace: "pre-wrap",
    wordBreak: 'break-word',
  };

  const footer: React.CSSProperties = {
    borderTop: "1px solid #353941",
    padding: "12px 16px",
    background: '#1e2025',
  };

  const inputBox: React.CSSProperties = {
    display: "flex",
    gap: 8,
  };

  const textarea: React.CSSProperties = {
    flex: 1,
    resize: "none",
    borderRadius: 12,
    border: "1px solid #353941",
    background: '#242830',
    color: '#e2e4e8',
    padding: "10px 14px",
    minHeight: 44,
    lineHeight: "20px",
  };

  const button: React.CSSProperties = {
    borderRadius: 12,
    padding: "0 16px",
    fontSize: 14,
    fontWeight: 600,
    background: "#316fea",
    color: "#fff",
    opacity: loading ? 0.6 : 1,
    cursor: loading ? "not-allowed" : "pointer",
    border: 'none',
  };

  return (
    <div style={panel}>
      <div style={header}>메이플 챗봇</div>
      <div style={body}>
        {messages.map((m, i) => (
          <div key={i} style={m.role === "user" ? bubbleUser : bubbleBot}>
            {m.content}
          </div>
        ))}
        {loading && <div style={bubbleBot}>답변 작성 중…</div>}
        <div ref={endRef} />
      </div>
      <div style={footer}>
        <div style={inputBox}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="예) 내 직업은 좋은편이야?"
            style={textarea}
          />
          <button onClick={ask} disabled={loading} style={button}>
            보내기
          </button>
        </div>
      </div>
    </div>
  );
}