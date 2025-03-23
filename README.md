# Training Data Collection Server

This server collects and stores training data for the Myanmar-English Translator app.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up MongoDB:
   - Install MongoDB locally or use MongoDB Atlas
   - Update MONGODB_URI in .env file

3. Start the server:
```bash
npm start
```

## API Endpoints

### POST /training-data
Add new training data pairs.

Request body:
```json
{
  "english": "Hello",
  "myanmar": "မင်္ဂလာပါ",
  "timestamp": "2024-03-21T12:00:00Z"
}
```

### GET /training-data
Retrieve latest training data (limited to 1000 entries).

## Data Storage
- Primary storage: MongoDB
- Backup storage: ./data/training-data.json

## Environment Variables
- PORT: Server port (default: 3000)
- MONGODB_URI: MongoDB connection string 