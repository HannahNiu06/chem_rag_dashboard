from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
import os
import shutil
from datetime import datetime
import random
import json
from PyPDF2 import PdfReader
import requests

app = Flask(__name__)
CORS(app)

# 文档上传目录
UPLOAD_FOLDER = "docs"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 模拟数据存储
qa_history = []
document_segments = {}

# 第三方主题提取 API（如 MinerU）配置
MINERU_API_URL = os.getenv("MINERU_API_URL", "")
MINERU_API_KEY = os.getenv("MINERU_API_KEY", "")


def _fallback_generate_topic(text: str) -> str:
    """在未配置第三方服务时的简单主题生成：取首行/首句，限长。"""
    if not text:
        return ""
    sample = text.strip().splitlines()[0] if "\n" in text else text.strip()
    # 简单句号分割（兼容中英文）
    for sep in ["。", ".", "!", "！", "?", "？", ":", "："]:
        if sep in sample:
            sample = sample.split(sep)[0]
            break
    # 截断，中文截 24 字，英文截 12 词
    if len(sample) > 48:
        return sample[:48] + "…"
    return sample


def _generate_topic_with_third_party(text: str) -> str:
    """调用第三方 API（如 MinerU）为分段生成主题。若失败则回退。"""
    if not MINERU_API_URL:
        return _fallback_generate_topic(text)
    try:
        headers = {"Content-Type": "application/json"}
        if MINERU_API_KEY:
            headers["Authorization"] = f"Bearer {MINERU_API_KEY}"
        payload = {"text": text}
        resp = requests.post(MINERU_API_URL, headers=headers, json=payload, timeout=20)
        if resp.status_code == 200:
            data = resp.json() if resp.content else {}
            # 兼容多种可能的返回结构
            topic = (
                (data.get("data") or {}).get("topic")
                or data.get("topic")
                or (data.get("result") or {}).get("title")
            )
            if isinstance(topic, str) and topic.strip():
                return topic.strip()
        # 非 200 或无有效 topic，回退
        return _fallback_generate_topic(text)
    except Exception:
        return _fallback_generate_topic(text)


def _segment_with_third_party(full_text: str):
    """调用第三方 API 进行分段和主题提取。期望返回形如：
    {
        "segments": [
            {"topic": "...", "content": "..."},
            ...
        ]
    }
    若失败或未配置，则返回 None。
    """
    if not MINERU_API_URL:
        return None
    try:
        headers = {"Content-Type": "application/json"}
        if MINERU_API_KEY:
            headers["Authorization"] = f"Bearer {MINERU_API_KEY}"
        payload = {"text": full_text, "task": "segment"}
        resp = requests.post(MINERU_API_URL, headers=headers, json=payload, timeout=60)
        if resp.status_code != 200:
            return None
        data = resp.json() if resp.content else {}
        segments = data.get("segments") or (data.get("data") or {}).get("segments")
        if not isinstance(segments, list):
            return None
        normalized = []
        for idx, seg in enumerate(segments, start=1):
            topic = seg.get("topic") or seg.get("title") or ""
            content = seg.get("content") or seg.get("text") or ""
            if not isinstance(content, str):
                continue
            if not isinstance(topic, str) or not topic.strip():
                topic = _fallback_generate_topic(content)
            normalized.append({
                "id": idx,
                "topic": topic.strip(),
                "content": content.strip(),
                "tags": []
            })
        return {"segments": normalized}
    except Exception:
        return None

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard_data():
    """获取仪表板数据"""
    files = os.listdir(UPLOAD_FOLDER) if os.path.exists(UPLOAD_FOLDER) else []
    
    # 生成检索趋势数据
    retrieval_data = [random.randint(15, 40) for _ in range(7)]
    retrieval_labels = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    
    # 生成标签云数据
    tag_cloud = ["高分子", "催化剂", "反应工程", "蒸馏", "热力学", "分离过程", "传热", "传质", "聚合", "裂解"]
    
    # 生成最近QA数据
    recent_qas = [
        {"question": "什么是催化裂化？", "answer": "催化裂化是一种提高轻质油产率的炼油过程，通过催化剂的作用，在高温高压条件下将重质油转化为轻质油。"},
        {"question": "聚乙烯和聚丙烯的区别？", "answer": "聚乙烯和聚丙烯在分子结构与性能上存在显著差异。聚乙烯具有更好的柔韧性，而聚丙烯具有更高的强度和耐热性。"},
        {"question": "热力学第一定律是什么？", "answer": "热力学第一定律是能量守恒定律，表明能量既不能被创造也不能被消灭，只能从一种形式转换为另一种形式。"}
    ]
    
    return jsonify({
        "doc_count": len(files),
        "segment_count": random.randint(800, 1200),
        "index_progress": random.randint(75, 95),
        "qa_success_rate": random.randint(85, 98),
        "recent_qas": recent_qas,
        "retrieval_data": retrieval_data,
        "retrieval_labels": retrieval_labels,
        "tag_cloud": tag_cloud
    })

@app.route('/api/documents', methods=['GET'])
def get_documents():
    """获取文档列表（真实文件）"""
    documents = []
    for filename in os.listdir(UPLOAD_FOLDER):
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(file_path):
            stat = os.stat(file_path)
            documents.append({
                "filename": filename,
                "size": stat.st_size,
                "upload_time": datetime.fromtimestamp(stat.st_mtime).strftime('%Y-%m-%d %H:%M:%S'),
                "tags": 0,  # 可扩展
                "uploader": "本地上传"
            })
    # 按上传时间倒序
    documents.sort(key=lambda x: x["upload_time"], reverse=True)
    return jsonify({"documents": documents})

@app.route('/api/upload', methods=['POST'])
def upload_files():
    """上传文件（真实存储）"""
    if 'files' not in request.files:
        return jsonify({"error": "No files provided"}), 400
    files = request.files.getlist('files')
    uploaded_files = []
    for file in files:
        if file.filename:
            file_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(file_path)
            uploaded_files.append(file.filename)
    # 返回最新文档列表
    return get_documents()

@app.route('/api/qa', methods=['POST'])
def process_qa():
    """处理QA请求"""
    data = request.get_json()
    question = data.get("question", "")
    
    # 模拟QA处理逻辑
    responses = {
        "催化": "催化反应是通过催化剂降低反应活化能，提高反应速率的过程。催化剂本身不参与反应，但能显著影响反应路径和选择性。",
        "热力学": "热力学研究能量转换和物质状态变化的基本规律。包括热力学第一定律（能量守恒）和第二定律（熵增原理）。",
        "分离": "分离过程包括蒸馏、萃取、吸附、膜分离等多种方法，用于将混合物中的组分分离。",
        "聚合": "聚合反应是将小分子单体连接成大分子聚合物的过程，包括自由基聚合、离子聚合等。",
        "裂解": "裂解是将大分子化合物在高温下分解为小分子的过程，常用于石油炼制。"
    }
    
    # 简单的关键词匹配
    answer = "这是一个很好的问题。根据知识库中的信息，我可以为您提供相关的解答。"
    for keyword, response in responses.items():
        if keyword in question:
            answer = response
            break
    
    # 记录QA历史
    qa_record = {
        "question": question,
        "answer": answer,
        "timestamp": datetime.now().isoformat(),
        "satisfaction": None
    }
    qa_history.append(qa_record)
    
    return jsonify({
        "answer": answer, 
        "sources": [
            {"document": "化工原理.pdf", "confidence": 95, "content": answer},
            {"document": "反应工程.docx", "confidence": 87, "content": "相关补充信息..."}
        ]
    })

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """提交反馈"""
    data = request.get_json()
    question = data.get("question", "")
    rating = data.get("rating", 0)
    feedback = data.get("feedback", "")
    
    # 更新QA历史中的满意度
    for qa in qa_history:
        if qa["question"] == question:
            qa["satisfaction"] = rating
            qa["feedback"] = feedback
            break
    
    return jsonify({"status": "success", "message": "反馈已提交"})

@app.route('/api/qa-history', methods=['GET'])
def get_qa_history():
    """获取QA历史"""
    return jsonify({"history": qa_history[-10:]})  # 返回最近10条记录

@app.route('/api/parser/segments', methods=['GET'])
def get_segments():
    """获取指定文档的分段（txt/pdf支持，docx暂不支持）。

    响应结构：{
        "segments": [
            {"id": 1, "topic": "…", "content": "…", "tags": []},
            …
        ],
        "error": ""  # 可选
    }
    若配置了第三方主题提取 API（环境变量 MINERU_API_URL/MINERU_API_KEY），
    将为每个分段生成 topic；否则使用本地回退逻辑。"""
    filename = request.args.get('filename')
    if not filename:
        return jsonify({"segments": [], "error": "未指定文档"})
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.isfile(file_path):
        return jsonify({"segments": [], "error": "文件不存在"})
    ext = filename.split('.')[-1].lower()
    if ext == 'txt':
        # 若配置第三方，则尝试一次性分段
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            full_text = f.read()
        third_party = _segment_with_third_party(full_text)
        if third_party:
            return jsonify(third_party)
        # 回退：简单分段：按空行或每20行分段
        segments = []
        lines = full_text.splitlines(keepends=True)
        chunk = []
        for i, line in enumerate(lines):
            if line.strip() == '' or len(chunk) >= 20:
                if chunk:
                    content = ''.join(chunk).strip()
                    segments.append({
                        "id": len(segments)+1,
                        "topic": _generate_topic_with_third_party(content),
                        "content": content,
                        "tags": []
                    })
                    chunk = []
            chunk.append(line)
        if chunk:
            content = ''.join(chunk).strip()
            segments.append({
                "id": len(segments)+1,
                "topic": _generate_topic_with_third_party(content),
                "content": content,
                "tags": []
            })
        return jsonify({"segments": segments})
    elif ext == 'pdf':
        # 每页为一段
        try:
            reader = PdfReader(file_path)
            page_texts = []
            for page in reader.pages:
                text = page.extract_text() or ''
                page_texts.append(text)
            full_text = "\n\n".join(page_texts)
            # 若配置第三方，则尝试一次性分段
            third_party = _segment_with_third_party(full_text)
            if third_party:
                return jsonify(third_party)
            # 回退：每页为一段
            segments = []
            for i, text in enumerate(page_texts):
                content = (text or '').strip() or f"第{i+1}页无文本内容"
                segments.append({
                    "id": i+1,
                    "topic": _generate_topic_with_third_party(content),
                    "content": content,
                    "tags": []
                })
            return jsonify({"segments": segments})
        except Exception as e:
            return jsonify({"segments": [], "error": f"PDF解析失败: {str(e)}"})
    else:
        return jsonify({"segments": [], "error": "暂不支持该类型文档分段"})

@app.route('/api/parser/tags', methods=['GET'])
def get_tags():
    """获取标签信息"""
    existing_tags = ["热力学", "催化", "过程控制", "反应工程", "分离过程"]
    suggested_tags = ["高分子", "蒸馏", "传热", "传质"]
    
    return jsonify({
        "existing_tags": existing_tags,
        "suggested_tags": suggested_tags
    })

@app.route('/api/parser/segments/<int:segment_id>', methods=['PUT'])
def update_segment(segment_id):
    """更新分段"""
    data = request.get_json()
    # 这里应该更新数据库中的分段信息
    return jsonify({"status": "success", "message": f"分段 {segment_id} 已更新"})

@app.route('/api/parser/tags', methods=['POST'])
def add_tag():
    """添加新标签"""
    data = request.get_json()
    new_tag = data.get("tag", "")
    # 这里应该将新标签保存到数据库
    return jsonify({"status": "success", "message": f"标签 '{new_tag}' 已添加"})

@app.route('/api/preview/<filename>', methods=['GET'])
def preview_file(filename):
    """预览文件内容，txt返回文本，pdf/docx返回类型提示"""
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.isfile(file_path):
        return jsonify({"error": "文件不存在"}), 404
    ext = filename.split('.')[-1].lower()
    if ext == 'txt':
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read(10000)  # 限制最大预览长度
        return jsonify({"type": "txt", "content": content})
    elif ext == 'pdf':
        return jsonify({"type": "pdf", "url": f"/api/download/{filename}"})
    elif ext == 'docx':
        return jsonify({"type": "docx", "url": f"/api/download/{filename}"})
    else:
        return jsonify({"type": "other", "url": f"/api/download/{filename}"})

@app.route('/api/download/<filename>', methods=['GET'])
def download_file(filename):
    """下载或预览文件，pdf/txt/docx支持浏览器内嵌预览"""
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    if not os.path.isfile(file_path):
        return jsonify({"error": "文件不存在"}), 404
    ext = filename.split('.')[-1].lower()
    if ext == 'pdf':
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=False, mimetype='application/pdf')
    elif ext == 'txt':
        # 直接返回文本内容，支持中文
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read(10000)
        return Response(content, mimetype='text/plain')
    elif ext == 'docx':
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True, mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    else:
        return send_from_directory(UPLOAD_FOLDER, filename, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True, port=5001) 