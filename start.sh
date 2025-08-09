#!/bin/bash

echo "🚀 启动化工知识库 RAG 系统..."

# 检查Python和Node.js是否安装
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装 Python3"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 安装后端依赖
echo "📦 安装后端依赖..."
cd backend
pip3 install --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org -r requirements.txt

# 启动后端服务
echo "🔧 启动后端服务 (端口 5001)..."
python3 app.py &
BACKEND_PID=$!

# 等待后端启动
sleep 3

# 安装前端依赖
echo "📦 安装前端依赖..."
cd ../frontend
npm install

# 启动前端服务
echo "🌐 启动前端服务 (端口 3000)..."
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ 服务启动成功！"
echo "📊 前端地址: http://localhost:3000"
echo "🔧 后端API: http://localhost:5001"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait 