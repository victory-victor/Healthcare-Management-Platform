require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');
const { seedInitialData } = require('./utils/seedData');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect database
  await connectDB();

  // Seed baseline data
  await seedInitialData();

  const server = app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🏥 MedAI Nexus Server active on http://localhost:${PORT}`);
    console.log(`🌐 Health endpoint: http://localhost:${PORT}/api/health`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });

  process.on('unhandledRejection', (err) => {
    console.error(`[Unhandled Rejection] ${err.message}`);
  });
};

startServer();
