# 化工知识库 RAG 系统

这是一个基于 React 前端和 Flask 后端的化工知识库检索增强生成（RAG）系统。该系统提供了文档管理、智能问答、文档解析等功能。

## 项目结构

```
chem_rag_dashboard/
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API 服务
│   │   └── App.js          # 主应用组件
│   └── package.json
├── backend/                 # Flask 后端
│   ├── app.py              # Flask 应用
│   └── requirements.txt    # Python 依赖
├── docs/                   # 文档存储目录
└── README.md
```

## 功能特性

### 🏠 Dashboard 仪表板
- 系统总览和统计数据
- 检索调用趋势图表
- 知识类型分布标签云
- 近期QA调用记录
- 系统状态监控

### 📁 文档管理
- 文件上传（支持拖拽）
- 文档列表展示
- 文件类型统计
- 文档筛选和搜索

### 🤖 QA测试
- 智能问答界面
- 实时聊天功能
- 答案分析
- 反馈评分系统
- 来源追踪

### ⚙️ 文档解析
- 文档分段预览
- 标签编辑和管理
- 分段展开/折叠
- 标签统计

## 技术栈

### 前端
- **React 19** - 用户界面框架
- **React Router** - 路由管理
- **Chart.js** - 图表库
- **Axios** - HTTP 客户端
- **CSS3** - 样式和动画

### 后端
- **Flask** - Web 框架
- **Flask-CORS** - 跨域支持
- **Python 3.8+** - 编程语言

## 安装和运行

### 1. 克隆项目
```bash
git clone <repository-url>
cd chem_rag_dashboard
```

### 2. 安装后端依赖
```bash
cd backend
pip install -r requirements.txt
```

### 3. 安装前端依赖
```bash
cd frontend
npm install
```

### 4. 启动后端服务
```bash
cd backend
python app.py
```
后端服务将在 `http://localhost:5000` 启动

### 5. 启动前端服务
```bash
cd frontend
npm start
```
前端应用将在 `http://localhost:3000` 启动

## API 接口

### Dashboard
- `GET /api/dashboard` - 获取仪表板数据

### 文档管理
- `GET /api/documents` - 获取文档列表
- `POST /api/upload` - 上传文件

### QA系统
- `POST /api/qa` - 处理问答请求
- `POST /api/feedback` - 提交反馈
- `GET /api/qa-history` - 获取QA历史

### 文档解析
- `GET /api/parser/segments` - 获取文档分段
- `GET /api/parser/tags` - 获取标签信息
- `PUT /api/parser/segments/<id>` - 更新分段
- `POST /api/parser/tags` - 添加新标签

## 开发说明

### 前端开发
- 使用函数式组件和 Hooks
- 组件化设计，便于维护
- 响应式布局，支持移动端
- 错误处理和加载状态

### 后端开发
- RESTful API 设计
- 错误处理和状态码
- 文件上传支持
- 模拟数据存储

## 部署

### 前端部署
```bash
cd frontend
npm run build
```
构建产物在 `build/` 目录

### 后端部署
```bash
cd backend
pip install -r requirements.txt
python app.py
```

## 贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 联系方式

如有问题或建议，请提交 Issue 或联系开发团队。
