import type { AnalyticsOverview } from "@/types/api";

function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(",");
}

function dateStamp(): string {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadAnalyticsCsv(overview: AnalyticsOverview): void {
  const rows: string[] = [];

  rows.push("PLATFORM TOTALS");
  rows.push(
    csvRow([
      "users",
      "students",
      "courses",
      "lessons",
      "labs",
      "masterClasses",
      "trainers",
      "lessonsCompleted",
      "quizSubmissions",
      "flagsSolved",
    ]),
  );
  rows.push(
    csvRow([
      overview.totals.users,
      overview.totals.students,
      overview.totals.courses,
      overview.totals.lessons,
      overview.totals.labs,
      overview.totals.masterClasses,
      overview.totals.trainers,
      overview.totals.lessonsCompleted,
      overview.totals.quizSubmissions,
      overview.totals.flagsSolved,
    ]),
  );
  rows.push("");

  rows.push("USER GROWTH");
  rows.push(csvRow(["date", "count"]));
  for (const p of overview.userGrowth) {
    rows.push(csvRow([p.date, p.count]));
  }
  rows.push("");

  rows.push("LEARNING ACTIVITY");
  rows.push(csvRow(["date", "lessons", "flags", "quizzes", "registrations"]));
  for (const a of overview.activity) {
    rows.push(csvRow([a.date, a.lessons, a.flags, a.quizzes, a.registrations]));
  }
  rows.push("");

  rows.push("QUIZ PERFORMANCE");
  rows.push(csvRow(["passed", "failed", "submissions", "passRate"]));
  rows.push(csvRow([overview.quizStats.passed, overview.quizStats.failed, overview.quizStats.submissions, overview.quizStats.passRate]));
  rows.push("");

  rows.push("FLAG SUBMISSIONS");
  rows.push(csvRow(["correct", "incorrect"]));
  rows.push(csvRow([overview.flagStats.correct, overview.flagStats.incorrect]));
  rows.push("");

  rows.push("COURSE COMPLETION");
  rows.push(csvRow(["courseTitle", "completed", "totalLessons", "students", "completionRate"]));
  for (const c of overview.courseStats) {
    rows.push(csvRow([c.courseTitle, c.completed, c.totalLessons, c.students, c.completionRate]));
  }
  rows.push("");

  rows.push("LAB USAGE");
  rows.push(csvRow(["labTitle", "starts", "solvers", "difficulty"]));
  for (const l of overview.labStats) {
    rows.push(csvRow([l.labTitle, l.starts, l.solvers, l.difficulty]));
  }
  rows.push("");

  rows.push("ROLE DISTRIBUTION");
  rows.push(csvRow(["role", "count"]));
  for (const r of overview.roleDistribution) {
    rows.push(csvRow([r.role, r.count]));
  }
  rows.push("");

  rows.push("DIVISION DISTRIBUTION");
  rows.push(csvRow(["division", "count"]));
  for (const d of overview.divisionDistribution) {
    rows.push(csvRow([d.division, d.count]));
  }
  rows.push("");

  rows.push("LEVEL DISTRIBUTION");
  rows.push(csvRow(["level", "count"]));
  for (const l of overview.levelDistribution) {
    rows.push(csvRow([l.level, l.count]));
  }
  rows.push("");

  rows.push("TOP PERFORMERS");
  rows.push(csvRow(["name", "organization/city/email", "division", "xp", "level", "flagsSolved", "lessonsCompleted"]));
  for (const p of overview.topPerformers) {
    rows.push(csvRow([p.name, p.organization || p.city || p.email, p.division, p.xp, p.level, p.flagsSolved, p.lessonsCompleted]));
  }

  triggerDownload(
    new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" }),
    `xpertclass-analytics-${dateStamp()}.csv`,
  );
}

export async function downloadAnalyticsPdf(overview: AnalyticsOverview): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const maxY = 280;
  const footerY = 290;
  const emerald: [number, number, number] = [5, 150, 105];
  const slate700: [number, number, number] = [51, 65, 85];
  const slate500: [number, number, number] = [100, 116, 139];
  const slate400: [number, number, number] = [148, 163, 184];
  const slate200: [number, number, number] = [226, 232, 240];
  const slate50: [number, number, number] = [248, 250, 252];

  let y = 44;

  const ensureSpace = (needed: number): void => {
    if (y + needed > maxY) {
      doc.addPage();
      y = margin;
    }
  };

  const sectionTitle = (title: string): void => {
    ensureSpace(18);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    doc.text(title.toUpperCase(), margin, y);
    y += 4;
    doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  const drawTable = (headers: { title: string; width: number; align?: "left" | "right" | "center" }[], dataRows: (string | number)[][]): void => {
    const headerH = 7;
    const rowH = 6;
    ensureSpace(headerH + Math.max(dataRows.length, 1) * rowH + 6);
    doc.setFillColor(emerald[0], emerald[1], emerald[2]);
    doc.rect(margin, y, contentWidth, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    let hx = margin;
    for (const h of headers) {
      const align = h.align === "right" ? "right" : h.align === "center" ? "center" : "left";
      const tx = h.align === "right" ? hx + h.width - 2 : h.align === "center" ? hx + h.width / 2 : hx + 2;
      doc.text(h.title, tx, y + 4.8, { align });
      hx += h.width;
    }
    y += headerH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (let i = 0; i < dataRows.length; i++) {
      doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      if (i % 2 === 1) {
        doc.setFillColor(slate50[0], slate50[1], slate50[2]);
        doc.rect(margin, y, contentWidth, rowH, "F");
      }
      doc.setTextColor(slate700[0], slate700[1], slate700[2]);
      hx = margin;
      for (let c = 0; c < headers.length; c++) {
        const h = headers[c];
        const value = dataRows[i][c] ?? "";
        const align = h.align === "right" ? "right" : h.align === "center" ? "center" : "left";
        const tx = h.align === "right" ? hx + h.width - 2 : h.align === "center" ? hx + h.width / 2 : hx + 2;
        doc.text(String(value), tx, y + 4, { align });
        hx += h.width;
      }
      y += rowH;
    }
    y += 4;
  };

  doc.setFillColor(emerald[0], emerald[1], emerald[2]);
  doc.rect(0, 0, pageWidth, 36, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.text("XpertClass", margin, 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("Analytics Report", margin, 25);
  doc.setTextColor(slate50[0], slate50[1], slate50[2]);
  doc.setFontSize(9);
  const generatedAt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  doc.text(`Generated ${generatedAt}`, pageWidth - margin, 16, { align: "right" });

  const totalItems: { label: string; value: number }[] = [
    { label: "Total Users", value: overview.totals.users },
    { label: "Students", value: overview.totals.students },
    { label: "Courses", value: overview.totals.courses },
    { label: "Lessons", value: overview.totals.lessons },
    { label: "Labs", value: overview.totals.labs },
    { label: "Master Classes", value: overview.totals.masterClasses },
    { label: "Trainers", value: overview.totals.trainers },
    { label: "Lessons Completed", value: overview.totals.lessonsCompleted },
    { label: "Quiz Submissions", value: overview.totals.quizSubmissions },
    { label: "Flags Solved", value: overview.totals.flagsSolved },
    { label: "Active Users (30d)", value: overview.totals.activeUsers30d },
  ];

  sectionTitle("Platform Totals");
  const cols = 4;
  const gap = 4;
  const cellW = (contentWidth - gap * (cols - 1)) / cols;
  const cellH = 15;
  const gridRows = Math.ceil(totalItems.length / cols);
  ensureSpace(gridRows * cellH + 4);
  for (let i = 0; i < totalItems.length; i++) {
    const item = totalItems[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = margin + col * (cellW + gap);
    const cy = y + row * cellH;
    doc.setFillColor(slate50[0], slate50[1], slate50[2]);
    doc.roundedRect(x, cy, cellW, cellH, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(slate500[0], slate500[1], slate500[2]);
    doc.text(item.label, x + 3, cy + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(emerald[0], emerald[1], emerald[2]);
    doc.text(item.value.toLocaleString(), x + 3, cy + 12);
  }
  y += gridRows * cellH + 6;

  sectionTitle("User Growth");
  const growthMax = Math.max(...overview.userGrowth.map((g) => g.count), 1);
  if (overview.userGrowth.length > 0) {
    const chartH = 40;
    const slot = contentWidth / overview.userGrowth.length;
    const barW = Math.max(slot - 2, 1);
    const labelEvery = Math.max(1, Math.ceil(overview.userGrowth.length / 6));
    const baselineY = y + chartH;
    ensureSpace(chartH + 8);
    doc.setDrawColor(slate200[0], slate200[1], slate200[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, baselineY, pageWidth - margin, baselineY);
    overview.userGrowth.forEach((g, i) => {
      const h = g.count > 0 ? Math.max((g.count / growthMax) * (chartH - 6), 1.5) : 0;
      const x = margin + i * slot + (slot - barW) / 2;
      if (h > 0) {
        doc.setFillColor(emerald[0], emerald[1], emerald[2]);
        doc.rect(x, baselineY - h, barW, h, "F");
      }
      if (i % labelEvery === 0 || i === overview.userGrowth.length - 1) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.setTextColor(slate400[0], slate400[1], slate400[2]);
        doc.text(g.date.slice(5), x + barW / 2, baselineY + 4, { align: "center" });
      }
    });
    y = baselineY + 8;
  } else {
    ensureSpace(10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(slate500[0], slate500[1], slate500[2]);
    doc.text("No growth data yet.", margin, y + 4);
    y += 10;
  }

  sectionTitle("Learning Activity");
  drawTable(
    [
      { title: "Date", width: 34 },
      { title: "Lessons", width: 34, align: "right" },
      { title: "Flags", width: 34, align: "right" },
      { title: "Quizzes", width: 34, align: "right" },
      { title: "Registrations", width: 34, align: "right" },
    ],
    overview.activity.map((a) => [a.date, a.lessons, a.flags, a.quizzes, a.registrations]),
  );

  sectionTitle("Quiz Performance");
  drawTable(
    [
      { title: "Passed", width: 42.5, align: "right" },
      { title: "Failed", width: 42.5, align: "right" },
      { title: "Submissions", width: 42.5, align: "right" },
      { title: "Pass Rate", width: 42.5, align: "right" },
    ],
    [[overview.quizStats.passed, overview.quizStats.failed, overview.quizStats.submissions, `${overview.quizStats.passRate}%`]],
  );

  sectionTitle("Flag Submissions");
  drawTable(
    [
      { title: "Correct", width: 85, align: "right" },
      { title: "Incorrect", width: 85, align: "right" },
    ],
    [[overview.flagStats.correct, overview.flagStats.incorrect]],
  );

  sectionTitle("Course Completion");
  drawTable(
    [
      { title: "Course", width: 80 },
      { title: "Completed", width: 22, align: "right" },
      { title: "Total Lessons", width: 24, align: "right" },
      { title: "Students", width: 22, align: "right" },
      { title: "Completion %", width: 22, align: "right" },
    ],
    overview.courseStats.map((c) => [c.courseTitle, c.completed, c.totalLessons, c.students, c.completionRate]),
  );

  sectionTitle("Lab Usage");
  drawTable(
    [
      { title: "Lab", width: 80 },
      { title: "Starts", width: 30, align: "right" },
      { title: "Solvers", width: 30, align: "right" },
      { title: "Difficulty", width: 30, align: "right" },
    ],
    overview.labStats.map((l) => [l.labTitle, l.starts, l.solvers, l.difficulty]),
  );

  sectionTitle("Role Distribution");
  drawTable(
    [
      { title: "Role", width: 130 },
      { title: "Count", width: 40, align: "right" },
    ],
    overview.roleDistribution.map((r) => [r.role, r.count]),
  );

  sectionTitle("Division Distribution");
  drawTable(
    [
      { title: "Division", width: 130 },
      { title: "Count", width: 40, align: "right" },
    ],
    overview.divisionDistribution.map((d) => [d.division, d.count]),
  );

  sectionTitle("Level Distribution");
  drawTable(
    [
      { title: "Level", width: 130 },
      { title: "Count", width: 40, align: "right" },
    ],
    overview.levelDistribution.map((l) => [`Level ${l.level}`, l.count]),
  );

  sectionTitle("Top Performers");
  drawTable(
    [
      { title: "Rank", width: 12, align: "right" },
      { title: "Name", width: 56 },
      { title: "Division", width: 28 },
      { title: "XP", width: 18, align: "right" },
      { title: "Level", width: 16, align: "right" },
      { title: "Flags", width: 14, align: "right" },
      { title: "Lessons", width: 26, align: "right" },
    ],
    overview.topPerformers.map((p, i) => [i + 1, p.name, p.division, p.xp, p.level, p.flagsSolved, p.lessonsCompleted]),
  );

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(slate400[0], slate400[1], slate400[2]);
    doc.text("XpertClass — Analytics Report", margin, footerY);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
  }

  doc.save(`xpertclass-analytics-${dateStamp()}.pdf`);
}