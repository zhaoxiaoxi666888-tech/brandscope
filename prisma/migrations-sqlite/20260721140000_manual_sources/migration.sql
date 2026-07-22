ALTER TABLE "Research" ADD COLUMN "keyFacts" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Research" ADD COLUMN "marketSignals" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Research" ADD COLUMN "marketingMeaning" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Research" ADD COLUMN "limitations" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Insight" ADD COLUMN "evidence" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Insight" ADD COLUMN "sourceIds" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Insight" ADD COLUMN "researchModules" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Insight" ADD COLUMN "isInference" BOOLEAN NOT NULL DEFAULT true;

PRAGMA foreign_keys=OFF;
CREATE TABLE "_ResearchToSource" (
  "A" TEXT NOT NULL,
  "B" TEXT NOT NULL,
  CONSTRAINT "_ResearchToSource_A_fkey" FOREIGN KEY ("A") REFERENCES "Research" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "_ResearchToSource_B_fkey" FOREIGN KEY ("B") REFERENCES "Source" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "_ResearchToSource" ("A","B") SELECT "researchId","id" FROM "Source";

CREATE TABLE "new_Source" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL DEFAULT '',
  "publisher" TEXT NOT NULL DEFAULT '',
  "publishedAt" DATETIME,
  "summary" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "retrievedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sourceType" TEXT NOT NULL DEFAULT 'OTHER',
  "qualityGrade" TEXT NOT NULL DEFAULT 'D',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "extractionStatus" TEXT NOT NULL DEFAULT 'MANUAL',
  "fingerprint" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Source_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Source" ("id","projectId","title","url","publisher","publishedAt","summary","content","retrievedAt","sourceType","qualityGrade","enabled","extractionStatus","fingerprint","createdAt","updatedAt")
SELECT s."id",r."projectId",s."title",s."url",s."publisher",s."publishedAt",s."summary",s."summary",s."retrievedAt",s."sourceType",CASE WHEN s."sourceType" IN ('OFFICIAL','INSTITUTION') THEN 'A' WHEN s."sourceType"='MEDIA' THEN 'B' WHEN s."sourceType" IN ('COMMERCE','COMMUNITY') THEN 'C' ELSE 'D' END,true,'MANUAL','legacy-' || s."id",s."createdAt",s."createdAt" FROM "Source" s JOIN "Research" r ON r."id"=s."researchId";
DROP TABLE "Source";
ALTER TABLE "new_Source" RENAME TO "Source";
CREATE UNIQUE INDEX "_ResearchToSource_AB_unique" ON "_ResearchToSource"("A","B");
CREATE INDEX "_ResearchToSource_B_index" ON "_ResearchToSource"("B");
CREATE UNIQUE INDEX "Source_projectId_fingerprint_key" ON "Source"("projectId","fingerprint");
CREATE INDEX "Source_projectId_enabled_idx" ON "Source"("projectId","enabled");
PRAGMA foreign_keys=ON;
