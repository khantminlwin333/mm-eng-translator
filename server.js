require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/models', express.static('models')); // Serve model files statically

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/translator', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

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

// Health check endpoint
app.head('/api/health', (req, res) => {
  res.sendStatus(200);
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

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
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 