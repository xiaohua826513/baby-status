const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "data");
const statusPath = path.join(dataDir, "status.json");
const port = Number(process.env.PORT || 3000);
const adminToken = process.env.ADMIN_TOKEN || "local-dev-token";

const defaultStatus = {
  status_key: "busy",
  status_label: "正在忙",
  emoji: "💻",
  custom_status: "",
  message: "本地预览服务已经打开。正式部署后，她打开 Vercel 的 /baby 链接就能长期看到这里。",
  return_option: "不确定",
  return_at: null,
  updated_at: new Date().toISOString()
};

const statusOptions = [
  { key: "study", label: "正在学习", emoji: "📚" },
  { key: "class", label: "正在上课", emoji: "🏫" },
  { key: "sleep", label: "正在睡觉", emoji: "😴" },
  { key: "game", label: "正在玩游戏", emoji: "🎮" },
  { key: "meal", label: "正在吃饭", emoji: "🍚" },
  { key: "busy", label: "正在忙", emoji: "💻" }
];

const returnOptions = [
  { key: "30m", label: "30分钟后", minutes: 30 },
  { key: "1h", label: "1小时后", minutes: 60 },
  { key: "later", label: "晚点", minutes: null },
  { key: "unknown", label: "不确定", minutes: null }
];

function ensureStatus() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(statusPath)) {
    fs.writeFileSync(statusPath, JSON.stringify(defaultStatus, null, 2), "utf8");
  }
}

function readStatus() {
  ensureStatus();
  return JSON.parse(fs.readFileSync(statusPath, "utf8"));
}

function writeStatus(status) {
  ensureStatus();
  fs.writeFileSync(statusPath, JSON.stringify(status, null, 2), "utf8");
}

function sendJson(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) req.destroy();
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function pageHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>宝宝状态同步</title>
  <style>
    :root{--ink:#3d3035;--muted:#7d6870;--line:rgba(105,72,82,.16);--rose:#e85f86;--mint:#7fcbb3;--cream:#fffaf1}
    *{box-sizing:border-box} body{margin:0;min-height:100svh;color:var(--ink);font-family:"Microsoft YaHei","PingFang SC",system-ui,sans-serif;background:radial-gradient(circle at top left,rgba(255,159,142,.28),transparent 30rem),linear-gradient(135deg,#fffaf1 0%,#fff2f6 48%,#effbf7 100%)}
    main{min-height:100svh;display:grid;place-items:center;padding:24px}.shell{width:min(100%,560px);padding:clamp(22px,5vw,42px);border:1px solid var(--line);border-radius:8px;background:rgba(255,255,255,.74);box-shadow:0 24px 70px rgba(142,88,101,.18);backdrop-filter:blur(18px)}
    .topline{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:14px}.dot{width:10px;height:10px;border-radius:999px;background:var(--mint);box-shadow:0 0 0 6px rgba(127,203,179,.18)}
    .hero{display:grid;grid-template-columns:96px 1fr;gap:22px;align-items:center;margin-top:32px}.emoji{width:96px;aspect-ratio:1;display:grid;place-items:center;border-radius:8px;background:linear-gradient(145deg,#fff3e7,#ffe6ee);border:1px solid rgba(232,95,134,.16);font-size:52px}
    .label{margin:0 0 8px;color:var(--rose);font-weight:700}h1{margin:0;font-size:clamp(30px,8vw,48px);line-height:1.08;letter-spacing:0}.msg{margin-top:28px;padding:18px 20px;border-radius:8px;background:var(--cream);border:1px solid rgba(255,159,142,.22);line-height:1.8;white-space:pre-wrap}
    .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:18px}.item{min-height:98px;padding:14px;border-radius:8px;background:rgba(255,255,255,.76);border:1px solid var(--line)}.item span{display:block;color:var(--muted);font-size:13px;margin-bottom:8px}.item strong{display:block;font-size:16px;line-height:1.45}
    @media(max-width:620px){main{align-items:stretch;padding:14px}.shell{align-self:center}.hero{grid-template-columns:76px 1fr;gap:16px}.emoji{width:76px;font-size:42px}.grid{grid-template-columns:1fr}}
  </style>
</head>
<body>
<main><section class="shell" aria-live="polite">
  <div class="topline"><span class="dot"></span><span>只属于我们的状态小窗</span></div>
  <div class="hero"><div class="emoji" id="emoji">💗</div><div><p class="label" id="label">当前状态</p><h1 id="title">读取中...</h1></div></div>
  <div class="msg" id="message">正在读取状态...</div>
  <div class="grid"><div class="item"><span>更新时间</span><strong id="updated">-</strong></div><div class="item"><span>已经持续</span><strong id="duration">-</strong></div><div class="item"><span>预计回来</span><strong id="return">-</strong></div></div>
</section></main>
<script>
const FOUR_HOURS=4*60*60*1000; let current=null;
function fmt(v){if(!v)return"还没有记录";return new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v))}
function dur(v){if(!v)return"刚刚开始";const m=Math.floor(Math.max(0,Date.now()-new Date(v).getTime())/60000),h=Math.floor(m/60);if(m<1)return"不到1分钟";if(m<60)return m+"分钟";if(h<24)return h+"小时"+(m%60?m%60+"分钟":"");return Math.floor(h/24)+"天"+(h%24?h%24+"小时":"")}
async function load(){const r=await fetch("/api/status",{cache:"no-store"});const p=await r.json();current=p.status;render()}
function render(){if(!current)return;const offline=current.updated_at&&Date.now()-new Date(current.updated_at).getTime()>FOUR_HOURS;const text=(current.custom_status||"").trim()||current.status_label||"还没有状态";document.querySelector("#emoji").textContent=current.emoji||"💗";document.querySelector("#label").textContent=offline?"可能离线":"当前状态";document.querySelector("#title").textContent=offline?"可能离线，上次状态是 "+text:text;document.querySelector("#message").textContent=(current.message||"今天也要被好好惦记。").trim();document.querySelector("#updated").textContent=fmt(current.updated_at);document.querySelector("#duration").textContent=dur(current.updated_at);document.querySelector("#return").textContent=current.return_at?current.return_option+"，约 "+fmt(current.return_at):current.return_option||"没有设置"}
load();setInterval(load,5000);setInterval(render,1000);
</script>
</body></html>`;
}

function meHtml() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>我的状态</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100svh;color:#3d3035;font-family:"Microsoft YaHei","PingFang SC",system-ui,sans-serif;background:linear-gradient(135deg,#fffaf1,#fff2f6 52%,#effbf7)}main{min-height:100svh;display:grid;place-items:center;padding:20px}.shell{width:min(100%,760px);padding:28px;border:1px solid rgba(105,72,82,.16);border-radius:8px;background:rgba(255,255,255,.78);box-shadow:0 22px 64px rgba(142,88,101,.17)}header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:20px}h1{margin:0;font-size:34px;letter-spacing:0}.preview{padding:10px 12px;border:1px solid rgba(105,72,82,.16);border-radius:8px;background:#fffaf1;color:#3d3035;text-decoration:none;font-weight:800}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.status,.ret,button.submit{border:1px solid rgba(105,72,82,.16);border-radius:8px;background:rgba(255,255,255,.76);color:#3d3035;cursor:pointer}.status{min-height:84px;text-align:left;padding:14px}.status span{display:block;font-size:28px;margin-bottom:8px}.active{border-color:rgba(232,95,134,.72);background:#fff0f4}.form{display:grid;gap:16px;margin-top:20px}label,.block{display:grid;gap:8px;color:#7d6870;font-size:14px;font-weight:800}input,textarea{width:100%;border:1px solid rgba(105,72,82,.16);border-radius:8px;background:rgba(255,255,255,.88);padding:12px 14px;font:inherit;color:#3d3035}textarea{min-height:96px;resize:vertical}.returns{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.ret{min-height:44px}.submit{min-height:52px;border:0;background:linear-gradient(135deg,#e85f86,#ff9f8e);color:white;font-weight:900}.notice{min-height:22px;margin:0;color:#7d6870}.error{color:#ad3657}.success{color:#2f856f}@media(max-width:660px){main{padding:14px}header{display:grid}.preview{text-align:center}.grid,.returns{grid-template-columns:1fr 1fr}}
</style>
</head>
<body>
<main><section class="shell">
<header><h1 id="headline">📚 正在学习</h1><a class="preview" href="/baby" target="_blank">看她看到的页面</a></header>
<div class="grid" id="statusGrid"></div>
<div class="form">
<label>自定义状态<input id="custom" maxlength="60" placeholder="比如：在图书馆赶作业"></label>
<label>留言<textarea id="msg" maxlength="280">我在处理手上的事，晚点回来陪你。</textarea></label>
<div class="block">预计回来时间<div class="returns" id="returnGrid"></div></div>
<label>Admin Token<input id="token" type="password" value="local-dev-token"></label>
<button class="submit" id="submit">同步给她看</button>
<p class="notice" id="notice"></p>
</div>
</section></main>
<script>
const statuses=${JSON.stringify(statusOptions)};
const returns=${JSON.stringify(returnOptions)};
let statusKey="study", returnKey="30m";
const sg=document.querySelector("#statusGrid"), rg=document.querySelector("#returnGrid"), headline=document.querySelector("#headline");
function selected(){return statuses.find(x=>x.key===statusKey)||statuses[0]}
function render(){const s=selected();headline.textContent=s.emoji+" "+(document.querySelector("#custom").value.trim()||s.label);sg.innerHTML=statuses.map(x=>'<button class="status '+(x.key===statusKey?'active':'')+'" data-key="'+x.key+'"><span>'+x.emoji+'</span><strong>'+x.label+'</strong></button>').join("");rg.innerHTML=returns.map(x=>'<button class="ret '+(x.key===returnKey?'active':'')+'" data-key="'+x.key+'">'+x.label+'</button>').join("")}
sg.onclick=e=>{const b=e.target.closest("[data-key]");if(!b)return;statusKey=b.dataset.key;render()};
rg.onclick=e=>{const b=e.target.closest("[data-key]");if(!b)return;returnKey=b.dataset.key;render()};
document.querySelector("#custom").oninput=render;
document.querySelector("#submit").onclick=async()=>{const n=document.querySelector("#notice");n.className="notice";n.textContent="正在同步...";const r=await fetch("/api/status",{method:"PUT",headers:{"Content-Type":"application/json",Authorization:"Bearer "+document.querySelector("#token").value.trim()},body:JSON.stringify({statusKey,returnKey,customStatus:document.querySelector("#custom").value,message:document.querySelector("#msg").value})});const p=await r.json().catch(()=>({}));if(!r.ok){n.className="notice error";n.textContent=p.error||"同步失败";return}n.className="notice success";n.textContent="同步成功，她的页面几秒内就会更新。"};
render();
</script>
</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const pathname = url.parse(req.url).pathname;

  if (req.method === "GET" && (pathname === "/" || pathname === "/baby")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(pageHtml());
    return;
  }

  if (req.method === "GET" && pathname === "/me") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(meHtml());
    return;
  }

  if (req.method === "GET" && pathname === "/api/status") {
    sendJson(res, 200, { status: readStatus() });
    return;
  }

  if (req.method === "PUT" && pathname === "/api/status") {
    const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
    if (token !== adminToken) {
      sendJson(res, 401, { error: "Unauthorized" });
      return;
    }

    const body = JSON.parse((await readBody(req)) || "{}");
    const selected = statusOptions.find((item) => item.key === body.statusKey) ?? statusOptions[5];
    const returnOption = returnOptions.find((item) => item.key === body.returnKey) ?? returnOptions[3];
    const now = new Date();
    const status = {
      status_key: selected.key,
      status_label: selected.label,
      emoji: selected.emoji,
      custom_status: body.customStatus || body.custom_status || "",
      message: body.message || "",
      return_option: returnOption.label,
      return_at: returnOption.minutes
        ? new Date(now.getTime() + returnOption.minutes * 60 * 1000).toISOString()
        : null,
      updated_at: now.toISOString()
    };
    writeStatus(status);
    sendJson(res, 200, { status });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
  res.end("Not found");
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Local preview is running at http://127.0.0.1:${port}/baby`);
});
