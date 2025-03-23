require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0';

// Log environment variables
console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/models', express.static('models')); // Serve model files statically

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'Server is running',
    endpoints: {
      health: '/api/health',
      trainingData: '/api/training-data',
      modelVersion: '/model/check-version'
    }
  });
});

// Health check endpoint with more details
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV,
    mongodbConnection: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// MongoDB connection
console.log('Attempting to connect to MongoDB...');
console.log('MongoDB URI:', process.env.MONGODB_URI ? 'URI is set' : 'URI is not set');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/translator', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB successfully'))
.catch(err => {
  console.error('MongoDB connection error details:', {
    message: err.message,
    code: err.code,
    name: err.name
  });
});

// Schemas
const ModelVersionSchema = new mongoose.Schema({
  version: String,
  fileName: String,
  releaseDate: { type: Date, default: Date.now },
  description: String,
  isActive: { type: Boolean, default: true }
});

const TrainingDataSchema = new mongoose.Schema({
  english: { type: String, required: true },
  myanmar: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  synced: { type: Boolean, default: true }
});

const ModelVersion = mongoose.model('ModelVersion', ModelVersionSchema);
const TrainingData = mongoose.model('TrainingData', TrainingDataSchema);

// Training data endpoints
app.post('/api/training-data', async (req, res) => {
  try {
    const { english, myanmar } = req.body;
    if (!english || !myanmar) {
      return res.status(400).json({ error: 'Both english and myanmar texts are required' });
    }

    const trainingData = new TrainingData({
      english,
      myanmar,
      synced: true
    });

    await trainingData.save();
    res.status(201).json(trainingData);
  } catch (error) {
    console.error('Error saving training data:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/training-data', async (req, res) => {
  try {
    const data = await TrainingData.find().sort({ timestamp: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Check current model version
app.get('/model/check-version', async (req, res) => {
  try {
    const currentVersion = req.query.version;
    const latestModel = await ModelVersion.findOne({ isActive: true })
      .sort({ releaseDate: -1 });

    if (!latestModel) {
      return res.json({ 
        hasUpdate: false 
      });
    }

    res.json({
      hasUpdate: currentVersion !== latestModel.version,
      latestVersion: latestModel.version,
      description: latestModel.description,
      downloadUrl: latestModel ? `/models/${latestModel.fileName}` : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start server
const server = app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Health check endpoint: http://${HOST}:${PORT}/api/health`);
});

// Graceful shutdown handler
const shutdown = (signal) => {
  console.log(`${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connection
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle different signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  shutdown('unhandledRejection');
}); 