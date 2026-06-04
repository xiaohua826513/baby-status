"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

const FOUR_HOURS = 4 * 60 * 60 * 1000;

function formatDateTime(value) {
  if (!value) return "还没有记录";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDuration(value, now) {
  if (!value) return "刚刚开始";
  const diff = Math.max(0, now.getTime() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);

  if (minutes < 1) return "不到1分钟";
  if (minutes < 60) return `${minutes}分钟`;
  if (hours < 24) return `${hours}小时${minutes % 60 ? `${minutes % 60}分钟` : ""}`;
  return `${Math.floor(hours / 24)}天${hours % 24 ? `${hours % 24}小时` : ""}`;
}

function returnText(status) {
  if (!status?.return_option) return "没有设置";
  if (status.return_at) return `${status.return_option}，约 ${formatDateTime(status.return_at)}`;
  return status.return_option;
}

export default function BabyPage() {
  const [status, setStatus] = useState(null);
  const [now, setNow] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStatus() {
    try {
      const response = await fetch("/api/status", { cache: "no-store" });
      if (!response.ok) throw new Error("读取状态失败");
      const payload = await response.json();
      setStatus(payload.status);
      setError("");
    } catch (err) {
      setError(err.message || "读取状态失败");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadStatus();
    const refreshTimer = window.setInterval(loadStatus, 5000);
    const clockTimer = window.setInterval(() => setNow(new Date()), 1000);

    return () => {
      window.clearInterval(refreshTimer);
      window.clearInterval(clockTimer);
    };
  }, []);

  const offline = useMemo(() => {
    if (!status?.updated_at) return false;
    return now.getTime() - new Date(status.updated_at).getTime() > FOUR_HOURS;
  }, [now, status]);

  const displayLabel = status?.custom_status?.trim() || status?.status_label || "还没有状态";
  const emoji = status?.emoji || "💗";

  return (
    <main className={styles.page}>
      <section className={styles.shell} aria-live="polite">
        <div className={styles.topline}>
          <span className={styles.dot} />
          <span>只属于我们的状态小窗</span>
        </div>

        <div className={styles.statusHero}>
          <div className={styles.emoji}>{emoji}</div>
          <div>
            <p className={styles.label}>{offline ? "可能离线" : "当前状态"}</p>
            <h1>{offline ? `可能离线，上次状态是 ${displayLabel}` : displayLabel}</h1>
          </div>
        </div>

        <div className={styles.messageBox}>
          <p>{status?.message?.trim() || "今天也要被好好惦记。"} </p>
        </div>

        <div className={styles.grid}>
          <div className={styles.infoItem}>
            <span>更新时间</span>
            <strong>{isLoading ? "正在读取..." : formatDateTime(status?.updated_at)}</strong>
          </div>
          <div className={styles.infoItem}>
            <span>已经持续</span>
            <strong>{formatDuration(status?.updated_at, now)}</strong>
          </div>
          <div className={styles.infoItem}>
            <span>预计回来</span>
            <strong>{returnText(status)}</strong>
          </div>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}
      </section>
    </main>
  );
}
