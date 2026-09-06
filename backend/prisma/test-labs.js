const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

const prisma = new PrismaClient();

async function main() {
  // Get all labs
  const labs = await prisma.$queryRaw`
    SELECT l.id, l.title, l."dockerImage", l.difficulty, l."resourceProfile",
      (SELECT COUNT(*) FROM "LabFlag" f WHERE f."labId" = l.id) as flag_count,
      (SELECT sd."displayName" FROM "LabSkill" ls JOIN "Skill" s ON s.id = ls."skillId" JOIN "SkillDomain" sd ON sd.id = s."domainId" WHERE ls."labId" = l.id LIMIT 1) as domain
    FROM "Lab" l
    ORDER BY l.title
  `;

  console.log(`Testing ${labs.length} labs...\n`);

  const results = { passed: 0, failed: 0, skipped: 0, errors: [] };

  for (let i = 0; i < labs.length; i++) {
    const lab = labs[i];
    const prefix = `[${i + 1}/${labs.length}]`;

    try {
      // Start container
      const containerName = `test-${lab.id.slice(0, 8)}`;
      const image = lab.dockerImage;

      // Check if image exists locally
      let imageExists = false;
      try {
        execSync(`docker image inspect ${image} 2>/dev/null`, { encoding: 'utf-8', timeout: 5000 });
        imageExists = true;
      } catch {
        imageExists = false;
      }

      if (!imageExists) {
        console.log(`${prefix} SKIP: ${lab.title} (image ${image} not available locally)`);
        results.skipped++;
        continue;
      }

      // Run container with timeout
      let containerId;
      try {
        containerId = execSync(
          `docker run -d --name ${containerName} --rm ${image} tail -f /dev/null 2>&1`,
          { encoding: 'utf-8', timeout: 30000 }
        ).trim();
      } catch (e) {
        console.log(`${prefix} FAIL: ${lab.title} — container start failed: ${e.message.slice(0, 80)}`);
        results.failed++;
        results.errors.push({ title: lab.title, error: 'container start failed' });
        continue;
      }

      // Wait for container to be ready
      execSync('sleep 2', { timeout: 5000 });

      // Check container is running
      let running = false;
      try {
        const status = execSync(
          `docker inspect --format='{{.State.Status}}' ${containerName} 2>/dev/null`,
          { encoding: 'utf-8', timeout: 5000 }
        ).trim();
        running = status === 'running';
      } catch {
        running = false;
      }

      if (!running) {
        console.log(`${prefix} FAIL: ${lab.title} — container not running`);
        results.failed++;
        results.errors.push({ title: lab.title, error: 'container not running' });
        // Cleanup
        try { execSync(`docker rm -f ${containerName} 2>/dev/null`, { timeout: 5000 }); } catch {}
        continue;
      }

      // Test exec into container
      let execOk = false;
      try {
        const output = execSync(
          `docker exec ${containerName} echo "EXEC_OK" 2>&1`,
          { encoding: 'utf-8', timeout: 10000 }
        ).trim();
        execOk = output.includes('EXEC_OK');
      } catch {
        execOk = false;
      }

      if (!execOk) {
        console.log(`${prefix} FAIL: ${lab.title} — exec failed`);
        results.failed++;
        results.errors.push({ title: lab.title, error: 'exec failed' });
        try { execSync(`docker rm -f ${containerName} 2>/dev/null`, { timeout: 5000 }); } catch {}
        continue;
      }

      // Test basic command
      let cmdOk = false;
      try {
        const output = execSync(
          `docker exec ${containerName} whoami 2>&1`,
          { encoding: 'utf-8', timeout: 10000 }
        ).trim();
        cmdOk = output.length > 0;
      } catch {
        cmdOk = false;
      }

      // Stop container
      try { execSync(`docker rm -f ${containerName} 2>/dev/null`, { timeout: 5000 }); } catch {}

      if (execOk && cmdOk) {
        console.log(`${prefix} PASS: ${lab.title} (image: ${image}, flags: ${lab.flag_count}, difficulty: ${lab.difficulty})`);
        results.passed++;
      } else {
        console.log(`${prefix} FAIL: ${lab.title} — command execution issue`);
        results.failed++;
        results.errors.push({ title: lab.title, error: 'command execution issue' });
      }

    } catch (e) {
      console.log(`${prefix} ERROR: ${lab.title} — ${e.message.slice(0, 80)}`);
      results.failed++;
      results.errors.push({ title: lab.title, error: e.message.slice(0, 100) });
      // Cleanup
      try { execSync(`docker rm -f test-${lab.id.slice(0, 8)} 2>/dev/null`, { timeout: 5000 }); } catch {}
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`RESULTS: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`);
  console.log(`Total: ${labs.length} labs`);

  if (results.errors.length > 0) {
    console.log(`\nFailed labs:`);
    results.errors.forEach(e => console.log(`  - ${e.title}: ${e.error}`));
  }

  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
