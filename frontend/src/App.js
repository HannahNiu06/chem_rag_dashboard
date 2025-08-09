import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Parser from './pages/Parser';
import QA from './pages/QA';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/parser" element={<Parser />} />
          <Route path="/qa" element={<QA />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 