# 部署指南

## 快速部署到 Cloudflare Pages

### 方法一：通过 Wrangler CLI

1. **安装 Wrangler**
   ```bash
   npm install -g wrangler
   ```

2. **登录 Cloudflare**
   ```bash
   wrangler login
   ```

3. **部署项目**
   ```bash
   cd cloudflare-ff14-assistant
   npm install
   wrangler pages deploy public
   ```

### 方法二：通过 Cloudflare Dashboard

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择 "Pages" → "Create a project"
3. 选择 "Upload assets"
4. 上传 `public` 文件夹中的所有文件
5. 上传 `functions` 文件夹
6. 点击 "Deploy site"

## 配置说明

- **Build command**: `echo "Build complete"`
- **Build output directory**: `public`
- **Root directory**: `/`

## 环境变量（可选）

如需要缓存功能，可在 Cloudflare Pages 设置中添加：
- `CACHE_TTL`: 缓存时间（秒）

## 自定义域名

在 Cloudflare Pages 项目设置中可以添加自定义域名。