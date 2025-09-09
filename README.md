# FF14 制作助手 - Cloudflare 版本

一个现代化的 FF14 制作助手 Web 应用，可部署到 Cloudflare Pages/Workers，提供物品搜索、配方分析和市场价格查询功能。

## ✨ 功能特性

### 🔍 物品搜索
- 支持中文物品名称搜索
- 实时搜索结果显示
- 物品详细信息查看

### 📋 制作清单管理
- 添加需要制作的物品和数量
- 支持批量配方分析
- 自动计算所需材料和成本

### 💰 市场价格查询
- 实时获取 Universalis 市场数据
- 支持多服务器选择
- 显示平均价格、最低价格等信息

### 🧮 配方分析
- 自动分析制作清单中所有物品的配方
- 计算所需材料总量
- 估算制作成本

## 🚀 快速开始

### 部署到 Cloudflare Pages

1. **克隆项目**
   ```bash
   git clone <your-repo-url>
   cd cloudflare-ff14-assistant
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **本地开发**
   ```bash
   npm run dev
   ```

4. **部署到 Cloudflare**
   ```bash
   npm run deploy
   ```

### 手动部署步骤

1. **登录 Cloudflare Dashboard**
   - 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - 选择 "Pages" 服务

2. **创建新项目**
   - 点击 "Create a project"
   - 选择 "Upload assets" 或连接 Git 仓库

3. **上传文件**
   - 将 `public` 文件夹中的所有文件上传
   - 将 `functions` 文件夹上传（用于 API 路由）

4. **配置设置**
   - Build command: `echo "Build complete"`
   - Build output directory: `public`
   - Root directory: `/`

## 📁 项目结构

```
cloudflare-ff14-assistant/
├── public/                 # 静态文件
│   ├── index.html         # 主页面
│   └── app.js            # 前端 JavaScript
├── functions/             # Cloudflare Functions
│   └── api/
│       └── [[path]].js   # API 路由处理器
├── package.json          # 项目配置
├── wrangler.toml        # Cloudflare 配置
└── README.md           # 项目说明
```

## 🔧 API 接口

### 搜索物品
```
POST /api/search
Content-Type: application/json

{
  "query": "黑铁锭"
}
```

### 获取物品详情
```
GET /api/item/{item_id}?server={server_name}
```

### 获取配方信息
```
GET /api/recipe/{item_id}
```

### 分析制作清单
```
POST /api/analyze-crafting-list
Content-Type: application/json

{
  "items": [
    {"id": 5057, "name": "黑铁锭", "quantity": 24}
  ],
  "server": "HongYuHai"
}
```

### 获取服务器列表
```
GET /api/servers
```

## 🌐 支持的服务器

### 中国服务器
- **陆行鸟**: 红玉海、神意之地、拉诺西亚、幻影群岛、萌芽池、宇宙和音、沃仙曦染、晨曦王座
- **莫古力**: 白银乡、白金幻象、神拳痕、潮风亭、旅人栈桥、复仇之剑、龙巢神殿、梦羽宝境
- **猫小胖**: 紫水栈桥、延夏、静语庄园、摩杜纳、海猫茶屋、柔风海湾、琥珀原
- **豆豆柴**: 水晶塔、银泪湖、太阳海岸、伊修加德、红茶川

### 国际服务器
- **Aether**: Adamantoise, Cactuar, Faerie, Gilgamesh, Jenova, Midgardsormr, Sargatanas, Siren
- **Crystal**: Balmung, Brynhildr, Coeurl, Diabolos, Goblin, Malboro, Mateus, Zalera
- **Primal**: Behemoth, Excalibur, Exodus, Famfrit, Hyperion, Lamia, Leviathan, Ultros

## 📊 使用示例

### 场景：制作玫瑰金锭 x24

1. **添加物品到制作清单**
   - 点击"添加物品"按钮
   - 搜索"玫瑰金锭"
   - 设置数量为 24
   - 点击"添加"

2. **分析配方**
   - 点击"分析配方"按钮
   - 系统自动分析所需材料
   - 显示材料清单和预估成本

3. **查看结果**
   - 查看所需的基础材料
   - 了解每种材料的市场价格
   - 计算总制作成本

## 🔧 技术栈

- **前端**: HTML5, CSS3 (Tailwind CSS), Vanilla JavaScript
- **后端**: Cloudflare Functions (Edge Runtime)
- **API**: CafeMaker API (XIVAPI 替代), Universalis API
- **部署**: Cloudflare Pages

## 🚀 性能优化

- **边缘计算**: 利用 Cloudflare 全球 CDN 网络
- **缓存策略**: 智能缓存 API 响应
- **轻量级**: 无需服务器，完全 Serverless
- **快速加载**: 静态资源 CDN 加速

## 🔒 隐私与安全

- 不收集用户个人信息
- 制作清单存储在本地浏览器
- 所有 API 请求通过 HTTPS 加密
- 遵循 FF14 服务条款

## 🤝 贡献指南

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [CafeMaker API](https://cafemaker.wakingsands.com/) - 提供物品和配方数据
- [Universalis](https://universalis.app/) - 提供市场价格数据
- [Tailwind CSS](https://tailwindcss.com/) - 提供 CSS 框架
- [Font Awesome](https://fontawesome.com/) - 提供图标

## 📞 支持

如果您遇到问题或有建议，请：

1. 查看 [Issues](../../issues) 页面
2. 创建新的 Issue
3. 提供详细的问题描述和复现步骤

---

**免责声明**: 本工具仅供学习和研究使用，不隶属于 Square Enix。所有 FF14 相关内容版权归 Square Enix 所有。