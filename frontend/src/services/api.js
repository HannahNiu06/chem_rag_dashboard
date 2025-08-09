import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Dashboard API
export const getDashboardData = async () => {
  try {
    const response = await api.get('/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

// Documents API
export const getDocuments = async () => {
  try {
    const response = await api.get('/documents');
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

export const uploadFiles = async (files) => {
  try {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    
    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

// QA API
export const processQA = async (question) => {
  try {
    const response = await api.post('/qa', { question });
    return response.data;
  } catch (error) {
    console.error('Error processing QA:', error);
    throw error;
  }
};

export const submitFeedback = async (feedbackData) => {
  try {
    const response = await api.post('/feedback', feedbackData);
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};

export const getQAHistory = async () => {
  try {
    const response = await api.get('/qa-history');
    return response.data;
  } catch (error) {
    console.error('Error fetching QA history:', error);
    throw error;
  }
};

// Parser API
export const getSegments = async ({ filename }) => {
  try {
    const response = await api.get(`/parser/segments`, { params: { filename } });
    return response.data;
  } catch (error) {
    console.error('Error fetching segments:', error);
    throw error;
  }
};

export const getTags = async () => {
  try {
    const response = await api.get('/parser/tags');
    return response.data;
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

export const updateSegment = async (segmentId, segmentData) => {
  try {
    const response = await api.put(`/parser/segments/${segmentId}`, segmentData);
    return response.data;
  } catch (error) {
    console.error('Error updating segment:', error);
    throw error;
  }
};

export const addTag = async (tag) => {
  try {
    const response = await api.post('/parser/tags', { tag });
    return response.data;
  } catch (error) {
    console.error('Error adding tag:', error);
    throw error;
  }
};

export const previewFile = async (filename) => {
  try {
    const response = await api.get(`/preview/${encodeURIComponent(filename)}`);
    return response.data;
  } catch (error) {
    console.error('Error previewing file:', error);
    throw error;
  }
};

export default api; 