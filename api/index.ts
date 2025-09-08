import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

const app = express();

// Vercel serverless function handler
export default app;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static files from public directory
app.use('/public', express.static(path.join(__dirname, '../public')));

const saveImageFromBase64 = (imageData: string): string => {
    if (!imageData.startsWith('data:image/')) {
        throw new Error('Invalid image data format');
    }

    const base64Data = imageData.split(';base64,').pop();
    if (!base64Data) {
        throw new Error('Could not extract base64 data');
    }
    
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const imageName = `${uuidv4()}.jpg`;
    const imagePath = path.join(__dirname, '../public/uploads', imageName);
    
    const uploadDir = path.join(__dirname, '../public/uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    fs.writeFileSync(imagePath, imageBuffer);

    // For Vercel, use the deployment URL
    const baseUrl = process.env.VERCEL_URL 
        ? `https://${process.env.VERCEL_URL}` 
        : `http://localhost:${process.env.PORT || 3000}`;
    
    return `${baseUrl}/public/uploads/${imageName}`;
};

// GET /api/articles - Mengambil semua artikel
app.get('/api/articles', async (req: Request, res: Response) => {
    try {
        const articles = await prisma.savedArticle.findMany({
            orderBy: {
                savedAt: 'desc',
            },
        });
        res.json(articles);
    } catch (error) {
        console.error("Failed to fetch articles:", error);
        res.status(500).json({ error: "Could not fetch articles" });
    }
});

// POST /api/articles - Menyimpan artikel baru
app.post('/api/articles', async (req: Request, res: Response) => {
    try {
        const { 
            primaryKeyword, 
            userLsiKeywords, 
            articles, 
            markdownContent, 
            thumbnailUrl,
            generationSettings,
            searchIntent,
            seoAnalysis,
            keywordResearchData
        } = req.body;
        
        const newArticle = await prisma.savedArticle.create({
            data: {
                primaryKeyword,
                userLsiKeywords,
                articles,
                markdownContent,
                thumbnailUrl,
                generationSettings,
                searchIntent,
                seoAnalysis,
                keywordResearchData,
            },
        });
        res.status(201).json(newArticle);
    } catch (error) {
        console.error("Failed to save article:", error);
        res.status(500).json({ error: "Could not save the article" });
    }
});

// DELETE /api/articles/:id - Menghapus artikel
app.delete('/api/articles/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.savedArticle.delete({
            where: { id },
        });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error("Failed to delete article:", error);
        res.status(500).json({ error: "Could not delete the article" });
    }
});

// POST /api/images/upload - Meng-upload gambar
app.post('/api/images/upload', (req: Request, res: Response) => {
    try {
        const { imageData } = req.body;
        if (!imageData) {
            return res.status(400).json({ error: 'imageData is required' });
        }
        const imageUrl = saveImageFromBase64(imageData);
        res.status(201).json({ url: imageUrl });
    } catch (error) {
        console.error("Image upload error:", error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Graceful shutdown untuk Prisma
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});