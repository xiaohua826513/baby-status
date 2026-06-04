"use client";

import { useEffect, useMemo, useState } from "react";
import { RETURN_OPTIONS, STATUS_OPTIONS } from "@/lib/status-options";
import styles from "./page.module.css";

function defaultMessage() {
  const hour = new Date().getHours();
  if (hour < 6) return "我可能睡着啦，醒来就找你。";
  if (hour < 12) return "上午先忙一会儿，心里有你。";
  if (hour < 18) return "我在处理手上的事，晚点回来陪你。";
  return "晚上也在想你，忙完就回来。";
}

export default function MePage() {
  const [statusKey, setStatusKey] = useState("study");
  const [returnKey, setReturnKey] = useState("30m");
  const [customStatus, setCustomStatus] = useState("");
  const [message, setMessage] = useState(defaultMessage);
  const [token, setToken] = useState("");
  const [saveToken, setSaveToken] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("idle");

  useEffect(() => {
    const stored = window.localStorage.getItem("baby_admin_token");
    if (stored) setToken(stored);
  }, []);

  const selectedStatus = useMemo(
    () => STATUS_OPTIONS.find((item) => item.key === statusKey) ?? STATUS_OPTIONS[0],
    [statusKey]
  );

  async function updateStatus() {
    setIsSaving(true);
    setNotice("正在同步...");
    setNoticeType("idle");

    try {
      const response = await fetch("/api/status", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`
        },
        body: JSON.stringify({
          statusKey,
          returnKey,
          customStatus,
          message
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "同步失败");

      if (saveToken) {
        window.localStorage.setItem("baby_admin_token", token.trim());
      } else {
        window.localStorage.removeItem("baby_admin_token");
      }

      setNotice("同步成功，她的页面几秒内就会更新。");
      setNoticeType("success");
    } catch (error) {
      setNotice(error.message || "同步失败");
      setNoticeType("error");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>我的状态</p>
            <h1>{selectedStatus.emoji} {customStatus.trim() || selectedStatus.label}</h1>
          </div>
          <a className={styles.preview} href="/baby" target="_blank" rel="noreferrer">
            看她看到的页面
          </a>
        </div>

        <div className={styles.statusGrid}>
          {STATUS_OPTIONS.map((item) => (
            <button
              className={`${styles.statusButton} ${item.key === statusKey ? styles.active : ""}`}
              key={item.key}
              onClick={() => setStatusKey(item.key)}
              type="button"
            >
              <span>{item.emoji}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>

        <div className={styles.form}>
          <label>
            <span>自定义状态</span>
            <input
              maxLength={60}
              onChange={(event) => setCustomStatus(event.target.value)}
              placeholder="比如：在图书馆赶作业"
              value={customStatus}
            />
          </label>

          <label>
            <span>留言</span>
            <textarea
              maxLength={280}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="比如：看到消息晚点回你，但我一直想你。"
              value={message}
            />
          </label>

          <div className={styles.returnBlock}>
            <span>预计回来时间</span>
            <div className={styles.returnGrid}>
              {RETURN_OPTIONS.map((item) => (
                <button
                  className={`${styles.returnButton} ${item.key === returnKey ? styles.active : ""}`}
                  key={item.key}
                  onClick={() => setReturnKey(item.key)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label>
            <span>Admin Token</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setToken(event.target.value)}
              placeholder="输入 Vercel 环境变量里的 ADMIN_TOKEN"
              type="password"
              value={token}
            />
          </label>

          <label className={styles.checkbox}>
            <input
              checked={saveToken}
              onChange={(event) => setSaveToken(event.target.checked)}
              type="checkbox"
            />
            <span>在这台设备保存 token</span>
          </label>

          <button
            className={styles.submit}
            disabled={isSaving || !token.trim()}
            onClick={updateStatus}
            type="button"
          >
            {isSaving ? "同步中..." : "同步给她看"}
          </button>

          {notice ? <p className={`${styles.notice} ${styles[noticeType]}`}>{notice}</p> : null}
        </div>
      </section>
    </main>
  );
}
