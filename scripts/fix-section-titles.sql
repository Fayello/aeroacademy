-- Remove numbering prefixes from section titles
UPDATE "Section" SET title = regexp_replace(title, '^\d+\.\s*', '') WHERE title ~ '^\d+\.';

-- Verify
SELECT id, title FROM "Section" ORDER BY "courseId", "order";
