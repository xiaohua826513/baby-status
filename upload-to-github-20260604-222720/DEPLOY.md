# 正式部署步骤

下面这套流程部署完成后，你会得到两个长期可访问链接：

- 给女朋友看：`https://你的项目名.vercel.app/baby`
- 你自己改状态：`https://你的项目名.vercel.app/me`

## 1. 准备 Supabase

1. 打开 https://supabase.com/dashboard
2. New project，新建一个项目。
3. 进入项目后，打开 SQL Editor。
4. 把 `supabase/schema.sql` 里的内容全部复制进去运行。
5. 打开 Project Settings -> API，复制：
   - Project URL
   - service_role key

注意：`service_role key` 只能放在 Vercel 环境变量里，不要发给别人，也不要写到网页前端。

## 2. 准备 Admin Token

自己生成一串很长的密码，例如 32 位以上随机字符，作为：

```text
ADMIN_TOKEN
```

这个 token 只有你自己知道。你打开 `/me` 修改状态时会用到它。

## 3. 上传到 GitHub

把整个 `D:\文档\宝宝` 项目上传到一个 GitHub 仓库。

不要上传这些文件：

```text
.env
.env.local
electron/.env
node_modules
.next
```

它们已经在 `.gitignore` 里。

## 4. 部署到 Vercel

1. 打开 https://vercel.com/new
2. Import 你的 GitHub 仓库。
3. Framework Preset 选择 Next.js。
4. Root Directory 保持仓库根目录。
5. Environment Variables 添加 3 个变量：

```env
SUPABASE_URL=你的 Supabase Project URL
SUPABASE_SERVICE_ROLE_KEY=你的 Supabase service_role key
ADMIN_TOKEN=你自己生成的长 token
```

6. 点 Deploy。

部署成功后，Vercel 会给你一个地址，例如：

```text
https://couple-status-sync.vercel.app
```

那么最终链接就是：

```text
https://couple-status-sync.vercel.app/baby
https://couple-status-sync.vercel.app/me
```

## 5. 设置你的 Electron 桌面端

复制 `electron/.env.example` 为 `electron/.env`：

```env
STATUS_WEB_URL=https://你的项目名.vercel.app
STATUS_ADMIN_TOKEN=和 Vercel 里的 ADMIN_TOKEN 一样
```

以后你有两个修改状态的入口：

- 线上网页：`https://你的项目名.vercel.app/me`
- 桌面端 Electron：运行 `npm run electron`

女朋友只需要打开：

```text
https://你的项目名.vercel.app/baby
```
