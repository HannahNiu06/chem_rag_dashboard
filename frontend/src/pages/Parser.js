import React, { useState, useEffect } from 'react';
import { getDocuments, uploadFiles, previewFile, getSegments, getTags } from '../services/api';

function getFileType(filename) {
  if (!filename) return '';
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'txt') return 'txt';
  return 'other';
}

const Parser = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [segments, setSegments] = useState([]);
  const [showOnlyTopics, setShowOnlyTopics] = useState(false);
  const [existingTags, setExistingTags] = useState([]);
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [segmentError, setSegmentError] = useState('');

  // 获取文档列表
  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data.documents);
    } catch (e) {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // 选择文档后获取内容和分段
  const fetchDocContentAndSegments = async (filename) => {
    setFileContent('');
    setSegments([]);
    setSegmentError('');
    if (!filename) return;
    setLoading(true);
    try {
      const type = getFileType(filename);
      if (type === 'txt') {
        // 获取内容
        const preview = await previewFile(filename);
        setFileContent(preview.content);
      } else if (type === 'pdf') {
        setFileContent('pdf'); // 标记为pdf，前端用iframe展示
      } else {
        setFileContent('暂不支持该类型文档的全览');
      }
      // 获取分段
      const segData = await getSegments({ filename });
      if (segData.error) setSegmentError(segData.error);
      setSegments(segData.segments || []);
    } catch (e) {
      setFileContent('文档加载失败');
      setSegments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
    getTags().then(tagsData => {
      setExistingTags(tagsData.existing_tags || []);
      setSuggestedTags(tagsData.suggested_tags || []);
    });
  }, []);

  useEffect(() => {
    if (selectedDocument) {
      fetchDocContentAndSegments(selectedDocument);
    } else {
      setFileContent('');
      setSegments([]);
      setSegmentError('');
    }
  }, [selectedDocument]);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (files) {
      setUploading(true);
      try {
        await uploadFiles(Array.from(files));
        fetchDocuments();
      } catch (e) {}
      setUploading(false);
    }
  };

  const toggleSegment = (segmentId) => {
    setSegments(prev => prev.map(seg =>
      seg.id === segmentId ? { ...seg, collapsed: !seg.collapsed } : seg
    ));
  };
  const expandAll = () => {
    setSegments(prev => prev.map(seg => ({ ...seg, collapsed: false })));
  };
  const collapseAll = () => {
    setSegments(prev => prev.map(seg => ({ ...seg, collapsed: true })));
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1><i className="fas fa-cogs"></i> 文档解析与分段 Document Parser & Segmenter</h1>
        <p className="subtitle">上传txt/pdf文档，自动分段并组织结构化标签</p>
      </header>

      {/* 上传区域 */}
      <div className="upload-section" style={{marginBottom:24}}>
        <div className="upload-card">
          <div className="upload-area" style={{padding:16}}>
            <input type="file" accept=".txt,.pdf" multiple style={{display:'none'}} id="parserFileInput" onChange={handleFileUpload} />
            <button className="btn-primary" onClick={()=>document.getElementById('parserFileInput').click()} disabled={uploading}>
              <i className="fas fa-upload"></i> 上传txt/pdf文档
            </button>
            {uploading && <span style={{marginLeft:12}}><i className="fas fa-spinner fa-spin"></i> 上传中...</span>}
          </div>
        </div>
      </div>

      {/* 文档选择器 */}
      <div className="document-selector" style={{marginBottom:16}}>
        <select className="doc-select" value={selectedDocument} onChange={e=>setSelectedDocument(e.target.value)}>
          <option value="">选择文档...</option>
          {documents.map(doc => (
            <option key={doc.filename} value={doc.filename}>{doc.filename}</option>
          ))}
        </select>
      </div>

      <div className="parser-container">
        {/* 左侧：文档全览 */}
        <div className="doc-overview">
          <h3><i className="fas fa-book"></i> 文档全览</h3>
          <div className="doc-content" style={{background:'#222',color:'#fff',padding:12,borderRadius:4,minHeight:120,maxHeight:300,overflow:'auto'}}>
            {loading ? <span><i className="fas fa-spinner fa-spin"></i> 加载中...</span> :
              (!selectedDocument ? <span style={{color:'#888'}}>请选择文档</span> :
                getFileType(selectedDocument)==='txt' ? fileContent :
                getFileType(selectedDocument)==='pdf' ? (
                  <iframe src={`http://localhost:5001/api/download/${encodeURIComponent(selectedDocument)}`} title="pdf全览" width="100%" height="260px" style={{border:'none',background:'#fff'}}></iframe>
                ) : fileContent
              )}
          </div>
        </div>
        {/* 中部：分段预览 */}
        <div className="segment-preview">
          <h3><i className="fas fa-eye"></i> 分段预览</h3>
          <div className="segment-controls">
            <button className="btn-small" onClick={expandAll}>全部展开</button>
            <button className="btn-small" onClick={collapseAll}>全部折叠</button>
            <label style={{marginLeft:12, display:'inline-flex', alignItems:'center', gap:8}}>
              <input type="checkbox" checked={showOnlyTopics} onChange={e=>setShowOnlyTopics(e.target.checked)} />
              仅显示主题
            </label>
          </div>
          <div className="segments-list">
            {segmentError && <div style={{color:'red',padding:'1rem'}}>{segmentError}</div>}
            {segments.map((segment) => (
              <div key={segment.id} className={`segment-item ${segment.collapsed ? 'collapsed' : ''}`}>
                <div className="segment-header" onClick={() => toggleSegment(segment.id)} style={{cursor:'pointer', display:'flex', alignItems:'center', gap:8}}>
                  <i className={`fas ${segment.collapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`}></i>
                  <span className="segment-number" style={{textAlign:'left'}}>段落 {segment.id}</span>
                  {segment.topic && (
                    <span className="segment-topic" style={{marginLeft:8, color:'#6cf'}} title="主题">
                      {segment.topic}
                    </span>
                  )}
                  <div className="segment-actions" onClick={(e)=>e.stopPropagation()} style={{marginLeft:'auto'}}>
                    <button className="btn-icon" title="编辑">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button className="btn-icon" title="删除">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                {!(segment.collapsed || showOnlyTopics) && (
                  <div className="segment-content">
                    <p>{segment.content}</p>
                  </div>
                )}
                <div className="segment-tags">
                  {segment.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* 右侧：标签编辑面板（保留原有） */}
        <div className="tag-panel">
          <h3><i className="fas fa-tags"></i> 标签编辑</h3>
          <div className="tag-section">
            <h4>已有标签</h4>
            <div className="existing-tags">
              {existingTags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag} <i className="fas fa-times"></i>
                </span>
              ))}
            </div>
          </div>
          <div className="tag-section">
            <h4>推荐标签</h4>
            <div className="suggested-tags">
              {suggestedTags.map((tag, index) => (
                <span key={index} className="tag suggested">
                  {tag} <i className="fas fa-plus"></i>
                </span>
              ))}
            </div>
          </div>
          <div className="tag-section">
            <h4>添加新标签</h4>
            <div className="add-tag-form">
              <input type="text" placeholder="输入新标签..." className="tag-input" />
              <button className="btn-small">添加</button>
            </div>
          </div>
          <div className="tag-stats">
            <h4>标签统计</h4>
            <div className="tag-chart">
              <div className="tag-bar">
                <span>热力学</span>
                <div className="bar" style={{ width: '80%' }}></div>
                <span>8</span>
              </div>
              <div className="tag-bar">
                <span>催化</span>
                <div className="bar" style={{ width: '65%' }}></div>
                <span>6</span>
              </div>
              <div className="tag-bar">
                <span>过程控制</span>
                <div className="bar" style={{ width: '45%' }}></div>
                <span>4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parser; 