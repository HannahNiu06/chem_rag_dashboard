import React from 'react';
import { NavLink } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="nav-brand">
        <i className="fas fa-atom"></i>
        <span>化工知识库 RAG 系统</span>
      </div>
      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-tachometer-alt"></i> Dashboard
        </NavLink>
        <NavLink to="/documents" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-file-alt"></i> 文档管理
        </NavLink>
        <NavLink to="/parser" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-cogs"></i> 文档解析
        </NavLink>
        <NavLink to="/qa" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-question-circle"></i> QA测试
        </NavLink>
      </div>
    </nav>
  );
};

export default Navbar; 