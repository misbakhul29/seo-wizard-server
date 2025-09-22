
import app from '../api/index.js';

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(Number(PORT), HOST, () => {
    console.log(`🚀 Server with Prisma is running at http://${HOST}:${PORT}`);
    console.log(`📊 Environment: ${NODE_ENV}`);
});
