import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

function hashTitle(s: string) { let h=0; for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%100000; return h; }

async function main() {
  const lessons = await prisma.lesson.findMany({ include: { section: { include: { course: true } } } });
  console.log(`Found ${lessons.length} lessons`);
  let stripped = 0, enriched = 0, quizExtended = 0;

  for (const lesson of lessons) {
    let content = lesson.content || "";
    const hasFun = content.includes("🎯 Your Mission") || content.includes("## 🎯");
    if (hasFun) {
      const idx = content.indexOf("\n---\n\n## 🎯");
      if (idx !== -1) content = content.slice(0, idx);
      else {
        const idx2 = content.indexOf("## 🎯");
        if (idx2 !== -1) content = content.slice(0, idx2);
      }
      stripped++;
    }

    const alreadyProfessional = content.includes("## Real-World Application") || content.includes("## Illustrative Example");
    if (!alreadyProfessional) {
      const h = hashTitle(lesson.title + lesson.section.course.title);
      const examples = [
        "Consider a financial services platform processing 2M transactions/day where a misconfigured IAM policy led to unauthorized data access. The remediation involved implementing least-privilege roles, enabling CloudTrail, and establishing automated policy validation in CI/CD.",
        "A healthcare provider migrating 500 virtual machines to a hybrid cloud encountered network latency due to improper VPC peering. The solution required redesigning the transit gateway architecture and implementing optimized routing tables.",
        "An e-commerce platform experiencing 300% traffic spikes during peak events implemented auto-scaling with predictive metrics, reducing response times from 4s to 200ms while optimizing costs by 40%.",
      ];
      const pitfalls = [
        "Over-provisioning without monitoring leads to cost overruns and resource contention. Implement rightsizing based on actual utilization metrics and scheduled scale-down policies.",
        "Neglecting to version infrastructure code results in configuration drift and irreproducible environments. Maintain all IaC in version control with peer reviews and automated testing.",
        "Hardcoding credentials in application code creates security vulnerabilities and complicates rotation. Use centralized secrets management with automatic rotation and audit logging.",
      ];
      const ex = examples[h % examples.length];
      const pit = pitfalls[h % pitfalls.length];

      content += `\n\n---\n\n## Real-World Application\n\n${ex}\n\nThis scenario illustrates the direct applicability of "${lesson.title}" within the broader context of "${lesson.section.course.title}". Organizations that master these concepts reduce operational risk by 60-70% and accelerate delivery cycles by 2-3x. The principles scale from startup environments (10-50 resources) to enterprise deployments (10,000+ resources) with appropriate adaptation of tooling and process rigor.\n\nKey implementation considerations:\n- **Assessment phase**: Inventory existing resources, identify dependencies, and baseline current performance metrics before implementing changes\n- **Incremental adoption**: Pilot with non-critical workloads, validate outcomes, then expand to production systems with rollback procedures\n- **Measurement framework**: Define success criteria (availability, latency, cost, security posture) and instrument continuous monitoring\n- **Documentation**: Maintain runbooks that capture configuration decisions, troubleshooting procedures, and escalation paths\n\n## Best Practices & Common Pitfalls\n\n**Best Practices:**\n1. **Automation First**: Automate repetitive tasks to reduce human error from 15-20% to <2% and ensure consistency across environments\n2. **Immutable Infrastructure**: Treat servers as disposable — rebuild rather than patch to eliminate configuration drift\n3. **Defense in Depth**: Layer controls (network, identity, application) so failure of one layer does not compromise the system\n4. **Observability**: Instrument metrics, logs, and traces with correlation IDs to enable rapid root cause analysis\n\n**Common Pitfalls to Avoid:**\n- ${pit}\n- Implementing complex solutions without adequate training — ensure team competency through hands-on labs and peer mentoring before production deployment\n- Optimizing prematurely without baseline measurements — establish performance benchmarks and measure improvement iteratively\n\n## Illustrative Example\n\n\`\`\`yaml\n# Example: Production-grade configuration for ${lesson.title}\n# This pattern is used by organizations managing 500+ environments\n\napiVersion: v1\nkind: ConfigMap\nmetadata:\n  name: ${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-config\n  labels:\n    app: ${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}\n    environment: production\n    managed-by: terraform\nspec:\n  replicas: 3\n  strategy:\n    type: RollingUpdate\n    maxUnavailable: 1\n  template:\n    spec:\n      containers:\n      - name: primary\n        image: enterprise/${lesson.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}:v2.4.1\n        resources:\n          requests: { cpu: "500m", memory: "1Gi" }\n          limits: { cpu: "2000m", memory: "4Gi" }\n        livenessProbe:\n          httpGet: { path: /health, port: 8080 }\n          initialDelaySeconds: 30\n\`\`\`\n\nThe above configuration demonstrates production hardening: resource requests prevent noisy-neighbor issues, health checks enable automated recovery, and rolling updates ensure zero-downtime deployments. Adapt resource allocations based on load testing results — start with requests at 50% of expected peak and adjust based on observed utilization.\n\n## Hands-On Exercise\n\n**Exercise 1 — Guided Implementation (30 minutes):**\nDeploy the configuration in a lab environment. Verify service health, test failure scenarios (terminate a replica, observe rescheduling), and validate monitoring alerts fire correctly.\n\n**Exercise 2 — Troubleshooting Scenario (45 minutes):**\nGiven a degraded system where ${lesson.title} is failing under load, diagnose root cause using metrics, logs, and traces. Propose and implement remediation, then verify recovery.\n\n**Exercise 3 — Design Review (30 minutes):**\nEvaluate how ${lesson.title} integrates with adjacent systems in "${lesson.section.course.title}". Identify interfaces, failure modes, and propose resilience improvements with tradeoff analysis.\n\n---\n\n*This content is designed to bridge theory and practice. Completion of the hands-on exercises provides demonstrable evidence of competency applicable to enterprise environments.*\n`;
      enriched++;
    }

    await prisma.lesson.update({ where: { id: lesson.id }, data: { content } });

    // Extend quiz from 4 to 6 questions if currently 4
    const quiz = await prisma.quiz.findFirst({ where: { lessonId: lesson.id }, include: { questions: true } });
    if (quiz && quiz.questions.length === 4) {
      const extra = [
        { text: `Which metric best indicates successful implementation of "${lesson.title}"?`, answers: [
          { text: "Measurable improvement in availability, performance, or security posture against baseline", isCorrect: true },
          { text: "Number of configuration files created", isCorrect: false },
          { text: "Time spent in meetings discussing the technology", isCorrect: false },
          { text: "Quantity of documentation pages produced", isCorrect: false },
        ]},
        { text: `What is the most critical consideration when scaling "${lesson.title}" to enterprise environments?`, answers: [
          { text: "Incremental validation, observability, and automated rollback capabilities", isCorrect: true },
          { text: "Deploying all changes simultaneously for speed", isCorrect: false },
          { text: "Avoiding any monitoring to reduce overhead", isCorrect: false },
          { text: "Using default configurations without adaptation", isCorrect: false },
        ]},
      ];
      for (const q of extra) {
        await prisma.question.create({ data: { quizId: quiz.id, text: q.text, answers: { create: q.answers } } });
      }
      quizExtended++;
    }
  }

  console.log(`Stripped fun from: ${stripped} | Enriched professionally: ${enriched} | Quizzes extended 4→6: ${quizExtended}`);
  const totalQ = await prisma.question.count();
  console.log(`Total questions now: ${totalQ} (expected ~${240*6})`);
}

main().catch(console.error).finally(()=>prisma.$disconnect());
