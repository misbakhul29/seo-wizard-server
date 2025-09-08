-- CreateTable
CREATE TABLE "SavedArticle" (
    "id" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "primaryKeyword" TEXT NOT NULL,
    "userLsiKeywords" JSONB NOT NULL,
    "articles" JSONB NOT NULL,
    "markdownContent" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "generationSettings" JSONB NOT NULL,
    "searchIntent" TEXT,
    "seoAnalysis" JSONB NOT NULL,
    "keywordResearchData" JSONB,

    CONSTRAINT "SavedArticle_pkey" PRIMARY KEY ("id")
);
