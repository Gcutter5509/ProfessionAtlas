"use client";

import { useRef, useState } from "react";

/** Отправляет запрос в /api/ai и постепенно собирает текстовый поток */
export function useAiStream() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  async function run(body: unknown) {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setText("");
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        setError((await res.text()) || `Ошибка ${res.status}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setText(acc);
      }
      if (!acc.trim()) setError("ИИ не вернул ответ. Попробуй ещё раз.");
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Не удалось связаться с сервером");
    } finally {
      if (abortRef.current === ac) setLoading(false);
    }
  }

  return { text, loading, error, run };
}
