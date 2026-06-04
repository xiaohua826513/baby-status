export const STATUS_OPTIONS = [
  { key: "study", label: "正在学习", emoji: "📚" },
  { key: "class", label: "正在上课", emoji: "🏫" },
  { key: "sleep", label: "正在睡觉", emoji: "😴" },
  { key: "game", label: "正在玩游戏", emoji: "🎮" },
  { key: "meal", label: "正在吃饭", emoji: "🍚" },
  { key: "busy", label: "正在忙", emoji: "💻" }
];

export const RETURN_OPTIONS = [
  { key: "30m", label: "30分钟后", minutes: 30 },
  { key: "1h", label: "1小时后", minutes: 60 },
  { key: "later", label: "晚点", minutes: null },
  { key: "unknown", label: "不确定", minutes: null }
];

export function getStatusOption(key) {
  return STATUS_OPTIONS.find((item) => item.key === key) ?? STATUS_OPTIONS[5];
}

export function getReturnOption(key) {
  return RETURN_OPTIONS.find((item) => item.key === key) ?? RETURN_OPTIONS[3];
}
