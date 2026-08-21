#!/bin/bash
sudo docker exec aeroacademy-db-1 psql -U user -d aeroacademy -t -A -F '|' -c "
SELECT f.title, f.description, f.\"correctAnswer\", l.title
FROM \"LabFlag\" f
JOIN \"Lab\" l ON l.id = f.\"labId\"
WHERE f.title IN ('User Deleter', 'Find World Writable', 'Group Manager', 'Column Extractor', 'Pipeline Master', 'Tar Packer', 'Sort & Count', 'Pipe Composer', 'awk Architect', 'Passwd Field Parse', 'Disk Space Expert', 'Process Inspector', 'Hidden Finder')
AND l.title LIKE '%Fundamentals%'
ORDER BY l.title, f.title;
"
