import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { getDocuments, uploadFiles, previewFile } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const fileTypeMap = {
  pdf: 'PDF文档',
  docx: 'Word文档',
  txt: '文本文件',
};

function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (ext === 'txt') return 'txt';
  return 'other';
}

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fileTypeStats, setFileTypeStats] = useState({
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 205, 86, 0.8)',
        'rgba(153, 102, 255, 0.8)'
      ],
      borderWidth: 2,
      borderColor: '#fff'
    }]
  });
  // 移除预览相关state和方法

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const data = await getDocuments();
      setDocuments(data.documents);
      // 统计文件类型
      const typeCount = { pdf: 0, docx: 0, txt: 0, other: 0 };
      data.documents.forEach(doc => {
        const type = getFileType(doc.filename);
        if (typeCount[type] !== undefined) typeCount[type]++;
        else typeCount.other++;
      });
      setFileTypeStats({
        labels: Object.keys(typeCount).map(type => fileTypeMap[type] || '其他'),
        datasets: [{
          ...fileTypeStats.datasets[0],
          data: Object.values(typeCount)
        }]
      });
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    // eslint-disable-next-line
  }, []);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (files) {
      try {
        await uploadFiles(Array.from(files));
        fetchDocuments();
      } catch (error) {
        console.error('Error uploading files:', error);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove('dragover');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files) {
      try {
        await uploadFiles(Array.from(files));
        fetchDocuments();
      } catch (error) {
        console.error('Error uploading files:', error);
      }
    }
  };

  const handleRefresh = () => {
    fetchDocuments();
  };

  // 移除handlePreview方法
  // 移除closePreview方法

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <header className="page-header">
          <h1><i className="fas fa-folder-open"></i> 文档管理 Document Management</h1>
          <p className="subtitle">上传、组织和管理知识库文档</p>
        </header>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
          <p>正在加载文档列表...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1><i className="fas fa-folder-open"></i> 文档管理 Document Management</h1>
        <p className="subtitle">上传、组织和管理知识库文档</p>
      </header>

      {/* 上传区域 */}
      <div className="upload-section">
        <div className="upload-card">
          <div 
            className="upload-area" 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <i className="fas fa-cloud-upload-alt"></i>
            <h3>拖拽文件到此处或点击上传</h3>
            <p>支持 PDF, DOCX, TXT 格式</p>
            <input 
              type="file" 
              multiple 
              accept=".pdf,.docx,.txt" 
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              id="fileInput"
            />
            <button 
              className="btn-primary" 
              onClick={() => document.getElementById('fileInput').click()}
            >
              <i className="fas fa-plus"></i> 选择文件
            </button>
            <button className="btn-secondary" style={{marginLeft: 12}} onClick={handleRefresh}>
              <i className="fas fa-sync"></i> 刷新
            </button>
          </div>
        </div>
      </div>

      {/* 文档列表和筛选 */}
      <div className="documents-section">
        <div className="section-header">
          <h2><i className="fas fa-list"></i> 文档列表</h2>
        </div>
        <div className="documents-grid">
          {documents.length === 0 && <div style={{color:'#fff',padding:'2rem'}}>暂无文档</div>}
          {documents.map((doc, index) => (
            <div key={index} className="document-card">
              <div className="doc-icon">
                <i className={
                  getFileType(doc.filename)==='pdf' ? 'fas fa-file-pdf' :
                  getFileType(doc.filename)==='docx' ? 'fas fa-file-word' :
                  getFileType(doc.filename)==='txt' ? 'fas fa-file-alt' :
                  'fas fa-file'
                }></i>
              </div>
              <div className="doc-info">
                <h4>
                  <a href={`http://localhost:5001/api/download/${encodeURIComponent(doc.filename)}`} target="_blank" rel="noopener noreferrer" style={{color:'#4fc3f7',textDecoration:'underline'}}>
                    {doc.filename}
                  </a>
                </h4>
                <p className="doc-meta">
                  <span><i className="fas fa-user"></i> {doc.uploader}</span>
                  <span><i className="fas fa-calendar"></i> {doc.upload_time}</span>
                  <span><i className="fas fa-database"></i> {Math.round(doc.size/1024)} KB</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 文件类型统计图 */}
      <div className="chart-section">
        <div className="chart-card">
          <div className="card-header">
            <h3><i className="fas fa-chart-pie"></i> 文件类型分布</h3>
          </div>
          <div className="chart-container">
            <Doughnut data={fileTypeStats} options={chartOptions} />
          </div>
        </div>
      </div>
      {/* 预览弹窗 */}
      {/* 移除预览弹窗 */}
    </div>
  );
};

export default Documents; 



