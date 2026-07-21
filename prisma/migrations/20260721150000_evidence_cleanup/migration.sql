-- 合并旧结构中同一项目内重复的 URL，同时保留所有 Research 引用。
INSERT OR IGNORE INTO "_ResearchToSource" ("A","B")
SELECT links."A", canonical."keepId"
FROM "_ResearchToSource" links
JOIN "Source" duplicate ON duplicate."id" = links."B"
JOIN (
  SELECT "projectId","url",MIN("id") AS "keepId"
  FROM "Source"
  WHERE "url" <> ''
  GROUP BY "projectId","url"
) canonical ON canonical."projectId" = duplicate."projectId" AND canonical."url" = duplicate."url";

DELETE FROM "Source"
WHERE "url" <> '' AND "id" NOT IN (
  SELECT MIN("id") FROM "Source" WHERE "url" <> '' GROUP BY "projectId","url"
);

UPDATE "Source" SET "extractionStatus"='SUCCESS' WHERE LENGTH("content") > 0;
CREATE UNIQUE INDEX "Source_projectId_url_unique" ON "Source"("projectId","url") WHERE "url" <> '';
