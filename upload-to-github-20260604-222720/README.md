# 宝宝状态同步

一个长期可用的情侣状态同步项目：桌面端用 Electron 更新状态，网页端用 Next.js 展示，数据存在 Supabase，网页部署到 Vercel 后可以得到固定的 `vercel.app/baby` 链接。

## 功能

- Electron 桌面端选择状态、填写自定义状态和留言、设置预计回来时间。
- `/me` 页面也可以作为你的线上状态修改入口，需要输入 `ADMIN_TOKEN`。
- Next.js API Route 使用 `ADMIN_TOKEN` 鉴权后写入 Supabase。
- `/baby` 页面只读展示当前状态、emoji、留言、更新时间、持续多久、预计回来时间。
- 网页每 5 秒自动轮询更新。
- 超过 4 小时没有更新时显示“可能离线，上次状态是 xxx”。
- Supabase `service_role` key 只放在 Next.js 服务端环境变量中，不暴露给网页或 Electron 渲染层。

## 本地运行

前置条件：安装 Node.js 20 或更新版本，并确保终端里可以使用 `npm`。

如果你当前电脑还没有 `npm`，可以先用内置 Node 跑一个只用于查看页面的本地兜底预览：

```powershell
node scripts/local-preview-server.cjs
```

然后打开：

```text
http://127.0.0.1:3000/baby
```

1. 安装依赖：

```bash
npm install
npm run install:electron
```

2. 在 Supabase SQL Editor 运行 `supabase/schema.sql`。

3. 复制环境变量文件：

```bash
cp .env.example .env.local
cp electron/.env.example electron/.env
```

如果你用的是 Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
Copy-Item electron/.env.example electron/.env
```

4. 修改 `.env.local`：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_TOKEN=自己生成一个很长的随机字符串
```

5. 修改 `electron/.env`：

```env
STATUS_WEB_URL=http://localhost:3000
STATUS_ADMIN_TOKEN=和 .env.local 里的 ADMIN_TOKEN 一样
```

6. 启动网页：

```bash
npm run dev
```

7. 另开一个终端启动桌面端：

```bash
npm run electron
```

8. 本地查看网页：

```text
http://localhost:3000/baby
```

9. 你的状态修改页面：

```text
http://localhost:3000/me
```

## Vercel 正式部署

更短的部署清单见 `DEPLOY.md`。

1. 把项目上传到 GitHub。
2. 打开 Vercel，选择 New Project，导入这个仓库。
3. Framework Preset 选择 Next.js。
4. 在 Vercel Project Settings -> Environment Variables 添加：

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
ADMIN_TOKEN=自己生成一个很长的随机字符串
```

5. 部署。部署成功后 Vercel 会给出类似：

```text
https://your-project.vercel.app
```

6. 把 `electron/.env` 改成正式地址：

```env
STATUS_WEB_URL=https://your-project.vercel.app
STATUS_ADMIN_TOKEN=和 Vercel 的 ADMIN_TOKEN 一样
```

7. 以后发给女朋友的长期链接就是：

```text
https://your-project.vercel.app/baby
```

你自己的线上修改入口是：

```text
https://your-project.vercel.app/me
```

打开后输入 `ADMIN_TOKEN`，就能更新状态。

## Supabase 安全说明

- `SUPABASE_SERVICE_ROLE_KEY` 只存在于 `.env.local` 和 Vercel 环境变量里，由 Next.js API Route 在服务端使用。
- Electron 只保存 `STATUS_ADMIN_TOKEN`，通过 `/api/status` 更新状态。
- `/me` 页面只保存你手动输入的 `ADMIN_TOKEN`，不会接触 Supabase `service_role` key。
- 女朋友打开 `/baby` 只会触发 GET 读取状态，不能修改状态。
- SQL 中启用了 RLS，并只给 `anon` 开放 select policy。

## 生产前检查

```bash
npm run build
```

构建成功后再部署到 Vercel。
