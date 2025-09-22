import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import livereload from 'livereload';
import connectLivereload from 'connect-livereload';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();
const app = express();

export default app;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
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

// Handler migrasi
const migrateHandler = async (req: Request, res: Response) => {
    try {
        // Ambil semua SavedArticle
        const savedArticles = await prisma.savedArticle.findMany();
        // Cari author default
        const defaultAuthor = await prisma.author.findFirst({ where: { name: 'Misbakhul Munir' } });
        if (!defaultAuthor) {
            return res.status(400).json({ error: 'Author default tidak ditemukan. Jalankan seeding dulu.' });
        }
        let migrated = 0;
        for (const saved of savedArticles) {
            // Pastikan articles berupa object hasil parse JSON
            let articlesObj: any = saved.articles;
            if (typeof articlesObj === 'string') {
                try {
                    articlesObj = JSON.parse(articlesObj);
                } catch {}
            }
            let mainArticle: any = null;
            if (articlesObj && typeof articlesObj === 'object') {
                const keys = Object.keys(articlesObj);
                if (keys.length > 0) {
                    mainArticle = articlesObj[keys[0]];
                }
            }
            if (!mainArticle) continue;
            // Cek slug unik
            const exists = await prisma.article.findUnique({ where: { slug: mainArticle.slug } });
            if (exists) continue;
            await prisma.article.create({
                data: {
                    title: mainArticle.title || '',
                    description: mainArticle.description || '',
                    content: mainArticle.content || '',
                    imageUrl: mainArticle.imageUrl || null,
                    slug: mainArticle.slug,
                    publishedAt: saved.savedAt,
                    tags: mainArticle.tags || [],
                    authorId: defaultAuthor.id,
                },
            });
            migrated++;
        }
        res.json({ migrated, message: `Migrasi selesai. ${migrated} artikel berhasil dipindahkan.` });
    } catch (error) {
        console.error('Migrasi gagal:', error);
        res.status(500).json({ error: 'Migrasi gagal', detail: error });
    }
};

// POST & GET /api/migrate-saved-articles
app.post('/api/migrate-saved-articles', migrateHandler);
app.get('/api/migrate-saved-articles', migrateHandler);

// GET /api/projects - Mengambil semua project
app.get('/api/projects', async (req: Request, res: Response) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { title: 'asc' }
        });
        res.json(projects);
    } catch (error) {
        console.error('Failed to fetch projects:', error);
        res.status(500).json({ error: 'Could not fetch projects' });
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

// Aktifkan livereload hanya di development
if (process.env.NODE_ENV !== 'production') {
    const liveReloadServer = livereload.createServer();
    liveReloadServer.watch([__dirname + '/../public', __dirname + '/../api', __dirname + '/../src']);
    app.use(connectLivereload());
    liveReloadServer.server.once('connection', () => {
        setTimeout(() => {
            liveReloadServer.refresh('/');
        }, 100);
    });
}