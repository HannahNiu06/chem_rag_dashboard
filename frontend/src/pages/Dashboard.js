import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { getDashboardData } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    docCount: 0,
    segmentCount: 0,
    indexProgress: 0,
    qaSuccessRate: 0
  });

  const [retrievalData, setRetrievalData] = useState({
    labels: [],
    datasets: [{
      label: '检索次数',
      data: [],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.1)',
      tension: 0.4,
      fill: true
    }]
  });

  const [tagCloud, setTagCloud] = useState([]);
  const [recentQAs, setRecentQAs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardData();
        
        setStats({
          docCount: data.doc_count,
          segmentCount: data.segment_count,
          indexProgress: data.index_progress,
          qaSuccessRate: data.qa_success_rate
        });
        
        setRetrievalData(prev => ({
          ...prev,
          labels: data.retrieval_labels,
          datasets: [{
            ...prev.datasets[0],
            data: data.retrieval_data
          }]
        }));
        
        setTagCloud(data.tag_cloud);
        setRecentQAs(data.recent_qas);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Don't set any fallback data - let the UI show empty state
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <header className="dashboard-header">
          <h1><i className="fas fa-chart-line"></i> 系统总览 Dashboard</h1>
          <p className="subtitle">实时监控RAG系统运行状态与知识库情况</p>
        </header>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
          <p>正在加载数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="dashboard-header">
        <h1><i className="fas fa-chart-line"></i> 系统总览 Dashboard</h1>
        <p className="subtitle">实时监控RAG系统运行状态与知识库情况</p>
      </header>

      {/* 数据卡片区域 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-alt"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.docCount}</h3>
            <p>文档总数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-layer-group"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.segmentCount}</h3>
            <p>分段数量</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-search"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.indexProgress}%</h3>
            <p>索引完成度</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.qaSuccessRate}%</h3>
            <p>QA成功率</p>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* 检索调用趋势图 */}
        <div className="chart-card">
          <div className="card-header">
            <h3><i className="fas fa-chart-bar"></i> 检索调用趋势</h3>
            <div className="chart-controls">
              <button className="btn-small active" data-period="week">本周</button>
              <button className="btn-small" data-period="month">本月</button>
            </div>
          </div>
          <div className="chart-container">
            <Line data={retrievalData} options={chartOptions} />
          </div>
        </div>

        {/* 标签分布词云 */}
        <div className="chart-card">
          <div className="card-header">
            <h3><i className="fas fa-tags"></i> 知识类型分布</h3>
          </div>
          <div className="tag-cloud">
            {tagCloud.map((tag, index) => (
              <span 
                key={index} 
                className="tag" 
                style={{ fontSize: `${Math.random() * 12 + 12}px` }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 近期QA调用记录 */}
      <div className="qa-section">
        <div className="card-header">
          <h3><i className="fas fa-comments"></i> 近期QA调用记录</h3>
          <span className="success-rate">成功率: {stats.qaSuccessRate}%</span>
        </div>
        <div className="qa-list">
          {recentQAs.map((qa, index) => (
            <div key={index} className="qa-item">
              <div className="qa-question">
                <i className="fas fa-question"></i>
                <span>{qa.question}</span>
              </div>
              <div className="qa-answer">
                <i className="fas fa-lightbulb"></i>
                <span>{qa.answer}</span>
              </div>
              <div className="qa-meta">
                <span className="qa-time">2分钟前</span>
                <span className="qa-status success">成功</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 系统状态指示器 */}
      <div className="system-status">
        <div className="status-item">
          <div className="status-indicator online"></div>
          <span>RAG引擎</span>
        </div>
        <div className="status-item">
          <div className="status-indicator online"></div>
          <span>向量数据库</span>
        </div>
        <div className="status-item">
          <div className="status-indicator online"></div>
          <span>文档处理器</span>
        </div>
        <div className="status-item">
          <div className="status-indicator online"></div>
          <span>API服务</span>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 