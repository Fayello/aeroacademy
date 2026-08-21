const bcrypt = require('bcrypt');
function normalize(a) { return a.trim().toLowerCase().replace(/[\s,;]+/g, ' ').trim(); }
function h(a) { return bcrypt.hashSync(normalize(a), 10); }
const D = 'c66a327d-7fa7-480c-ba2a-5b94d6216d6d';
const flags = [
  { t: 'Volume Builder', d: 'Create a volume called mydata. Run: docker run -v mydata:/data ubuntu:22.04 sh -c "echo hello > /data/test.txt". Then run: docker run -v mydata:/data ubuntu:22.04 cat /data/test.txt. What is the content?', a: 'hello', p: 100 },
  { t: 'Dockerfile Crafter', d: 'Create /home/student/Dockerfile with: FROM ubuntu:22.04, RUN echo "built" > /proof.txt, CMD ["cat", "/proof.txt"]. Build it as "myproof". Run: docker run myproof. What is the output?', a: 'built', p: 100 },
  { t: 'Multi-Stage Builder', d: 'Create a Dockerfile with multi-stage build: FROM alpine:3.18 AS builder, RUN echo "stage1" > /out.txt, then FROM alpine:3.18, COPY --from=builder /out.txt /final.txt, CMD ["cat", "/final.txt"]. Build and run. What is the output?', a: 'stage1', p: 100 },
  { t: 'Resource Limiter', d: 'Run: docker run -d --memory=64m --name limited nginx:latest. Then: docker inspect limited --format "{{.HostConfig.Memory}}". What value in bytes?', a: '67108864', p: 100 },
  { t: 'Network Bridge', d: 'Create a Docker network called mynet. Run: docker run -d --network mynet --name app1 nginx:latest. Then: docker exec app1 ping -c 1 app1 2>&1 | head -1. What is the first word of the PING line?', a: 'PING', p: 100 },
  { t: 'Tag & Push', d: 'Run: docker tag nginx:latest myregistry.azurecr.io/web:v1. Then: docker images myregistry.azurecr.io/web --format "{{.Tag}}". What is the tag?', a: 'v1', p: 100 },
  { t: 'Compose Starter', d: 'Create /home/student/docker-compose.yml with 2 services (web1, web2) both using nginx:latest with ports 8081:80 and 8082:80. Run: docker compose -f /home/student/docker-compose.yml up -d. Then: docker compose -f /home/student/docker-compose.yml ps | grep -c "running". How many services are running?', a: '2', p: 100 },
  { t: 'Layer Inspector', d: 'Run: docker history nginx:latest --format "{{.Size}}" | wc -l. How many layers does the nginx image have?', a: '10', p: 100 },
  { t: 'Container Restart', d: 'Run: docker run -d --restart=always --name res nginx:latest. Then: docker inspect res --format "{{.HostConfig.RestartPolicy.Name}}". What restart policy is set?', a: 'always', p: 75 },
  { t: 'Exec & Diff', d: 'Run: docker exec web echo "line1" > /tmp/from_host.txt && docker cp /tmp/from_host.txt web:/tmp/copied.txt && docker exec web cat /tmp/copied.txt. What is the content?', a: 'line1', p: 100 },
];
const lines = [];
for (const f of flags) {
  const id = require('crypto').randomUUID();
  lines.push(`INSERT INTO "LabFlag" (id, "labId", title, description, points, "correctAnswer") VALUES ('${id}', '${D}', '${f.t.replace(/'/g,"''")}', '${f.d.replace(/'/g,"''")}', ${f.p}, '${h(f.a)}');`);
}
console.log(lines.join('\n'));
