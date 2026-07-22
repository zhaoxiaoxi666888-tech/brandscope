-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "targetMarket" TEXT NOT NULL,
    "competitors" TEXT NOT NULL,
    "researchObjective" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GenerationRun" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "elapsedMs" INTEGER NOT NULL DEFAULT 0,
    "failureReason" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "GenerationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyBudget" (
    "date" TEXT NOT NULL,
    "usedCalls" INTEGER NOT NULL DEFAULT 0,
    "callLimit" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyBudget_pkey" PRIMARY KEY ("date")
);

-- CreateTable
CREATE TABLE "Research" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "inference" TEXT NOT NULL DEFAULT '',
    "keyFacts" TEXT NOT NULL DEFAULT '',
    "marketSignals" TEXT NOT NULL DEFAULT '',
    "marketingMeaning" TEXT NOT NULL DEFAULT '',
    "limitations" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'READY',
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Research_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL DEFAULT '',
    "publisher" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "summary" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "retrievedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sourceType" TEXT NOT NULL DEFAULT 'OTHER',
    "qualityGrade" TEXT NOT NULL DEFAULT 'D',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "extractionStatus" TEXT NOT NULL DEFAULT 'MANUAL',
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "evidence" TEXT NOT NULL DEFAULT '',
    "sourceIds" TEXT NOT NULL DEFAULT '[]',
    "researchModules" TEXT NOT NULL DEFAULT '[]',
    "isInference" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brief" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "background" TEXT NOT NULL,
    "marketingObjective" TEXT NOT NULL,
    "positioning" TEXT NOT NULL,
    "persona" TEXT NOT NULL,
    "coreInsights" TEXT NOT NULL,
    "communication" TEXT NOT NULL,
    "contentSuggestions" TEXT NOT NULL,
    "channels" TEXT NOT NULL,
    "kpis" TEXT NOT NULL,
    "markdown" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brief_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ResearchToSource" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ResearchToSource_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Project_ownerId_updatedAt_idx" ON "Project"("ownerId", "updatedAt");

-- CreateIndex
CREATE INDEX "Project_ownerId_createdAt_idx" ON "Project"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationRun_ownerId_createdAt_idx" ON "GenerationRun"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "GenerationRun_status_createdAt_idx" ON "GenerationRun"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GenerationRun_projectId_operation_key" ON "GenerationRun"("projectId", "operation");

-- CreateIndex
CREATE INDEX "Research_projectId_position_idx" ON "Research"("projectId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Research_projectId_module_key" ON "Research"("projectId", "module");

-- CreateIndex
CREATE INDEX "Source_projectId_enabled_idx" ON "Source"("projectId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "Source_projectId_fingerprint_key" ON "Source"("projectId", "fingerprint");

-- CreateIndex
CREATE INDEX "Insight_projectId_position_idx" ON "Insight"("projectId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "Brief_projectId_key" ON "Brief"("projectId");

-- CreateIndex
CREATE INDEX "_ResearchToSource_B_index" ON "_ResearchToSource"("B");

-- AddForeignKey
ALTER TABLE "GenerationRun" ADD CONSTRAINT "GenerationRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Research" ADD CONSTRAINT "Research_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Source" ADD CONSTRAINT "Source_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Brief" ADD CONSTRAINT "Brief_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchToSource" ADD CONSTRAINT "_ResearchToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Research"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ResearchToSource" ADD CONSTRAINT "_ResearchToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Business data is not exposed through the Supabase Data API. Next.js server
-- routes authenticate users and enforce ownerId; the database connection role
-- is server-only and can continue to operate with RLS enabled.
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Research" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Source" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Insight" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Brief" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GenerationRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DailyBudget" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_ResearchToSource" ENABLE ROW LEVEL SECURITY;
