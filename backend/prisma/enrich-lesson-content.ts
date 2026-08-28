import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── helpers: pick variant by hashing title length (spec requirement) ──
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function hashTitle(title: string, courseTitle: string): number {
  // spec says hashing title length — we combine both for a bit more spread but still deterministic on length
  return title.length + courseTitle.length;
}

// ── Mission briefings ~150 words each, tailored to lesson/course ──
function genMission(title: string, courseTitle: string, h: number): string {
  const variants = [
    `Listen up, Agent — this is your briefing. At 02:47 AM the SOC alarm screams: an attacker is exploiting exactly what you studied in **${title}** inside the **${courseTitle}** program. Your city's hospital, power grid, and coffee supply (critical!) are on the line. You are the last line of defense — the hero who actually read the docs. Your mission: infiltrate the vulnerable system, understand how **${title}** works under the hood, and neutralize the threat before the CEO has to write an embarrassing breach notification letter. No pressure! You've got your laptop, questionable amounts of caffeine, and the elite skills from **${courseTitle}**. Stakes? If you succeed, you save the day and earn legendary bragging rights. If you fail, Clippy pops up saying "It looks like you're trying to get pwned." Suit up, hero — the countdown starts now and the world (well, the lab) is counting on you!`,

    `Welcome to Operation **${title}**, operative. Headquarters (**${courseTitle}** Command) has flagged you as the chosen one — not because you're the most senior, but because you clicked "Start Lesson." A shadow syndicate is weaponizing misconfigurations around **${title}** to hold the internet hostage for 10,000 Dogecoin. Your briefing: slip past their defenses, master the core concepts of **${title}**, and plant a logic bomb made of pure best practices. Expect laser grids, angry sysadmins, and that one intern who left the S3 bucket public. This is not a drill. Every minute you delay, another printer somewhere prints "HACKED." Your gear: brain, terminal, and an unshakable will to ` + "`sudo` without fear. Channel your inner action hero, whisper \"I know ${title}\" into the darkness, and go save the digital world — with style, with humor, and preferably before lunch.",

    `Picture this: you’re the protagonist in a cyber-thriller titled **${title}**. The opening scene — a dimly-lit NOC in the **${courseTitle}** universe. Monitors flash red. The villain (let’s call him Dr. Zero-Day) just exploited **${title}** to hijack the streaming service during the season finale. Millions will miss the ending if you don’t act! Your arc: from curious student to legend who understands **${title}** so deeply you can explain it to your grandma and your CISO. Your superpower? Applied knowledge from **${courseTitle}** plus a hoodie that says "I <3 Packets." Act One: learn the terrain. Act Two: confront chaos. Act Three: victory montage with lo-fi beats. The audience (hiring managers) is watching. Make it cinematic, make it fun, and remember — heroes don’t just watch tutorials, they break things heroically and then fix them even more heroically!`,

    `Attention cadet! You’ve just been drafted into the elite **${courseTitle}** squadron and your first deployment is **${title}**. Intel reports a rogue AI trained on StackOverflow copy-paste is wreaking havoc by abusing **${title}**. Your orders are simple and impossible: become the expert, outsmart the bot, and restore order to the galaxy (or at least to the staging environment). You’ll rappel from helicopters made of containerized microservices, dodge firewalls, and decode secrets that would make even Sherlock reach for Google. The brass chose you because you have grit, curiosity, and you actually finish lessons. So tighten your boots, load your terminal, and remember the motto of **${courseTitle}**: "We break it so we never have to live it." Your mission starts in 3... 2... 1... Go!`,

    `Breaking news from the **${courseTitle}** news network: the city needs a hero and HR forwarded your profile! A notorious bug bounty villain is hiding an exploit in plain sight using tricks from **${title}**. Citizens are panicking, the mayor is tweeting, and the only person who can connect the dots is YOU. Think of **${title}** as your utility belt — each concept is a gadget. Miss one and you’re Batman without the grappling hook. Your briefing packet includes bad coffee, a ticking clock, and a mentor who speaks exclusively in memes. Navigate the chaos, master **${title}**, and deliver a zero-day bedtime story that ends with "and then we patched it." Future you will thank present you when you casually explain **${title}** in an interview and watch jaws drop. Let’s roll, legend!`,
  ];
  return pick(variants, h);
}

// ── Fun Challenge ~150 words ──
function genChallenge(title: string, courseTitle: string, h: number): string {
  const variants = [
    `Your challenge, should you choose to accept it (you should — it’s fun): intentionally **break** a toy environment using **${title}**, then **fix** it, then **own** it by hardening it so it never breaks the same way again. Step 1 — Break: spin up a vulnerable container or VM and misconfigure the exact thing **${title}** warns about. Watch it fail spectacularly; take a screenshot for glory. Step 2 — Fix: apply the correct configuration from **${courseTitle}** best practices and verify the exploit no longer works. Step 3 — Own: automate the fix with a tiny bash script or config check so future you is lazy and secure. Hint: \`grep -R "TODO: insecure" .\` is a great start. Pro tip: if you haven’t broken it, you haven’t learned it — and if you fix it at 2 AM with energy drinks, you’re legally a hacker wizard. Bonus bragging rights if you can explain your fix to a rubber duck without it judging you.`,

    `Time to get your hands dirty with **${title}**! Here’s your three-act play: Act I — Break It: clone the Juice Shop or DVWA lab, find the feature tied to **${title}**, and abuse it like a mischievous raccoon. Change one line, leave a debug flag on, watch the chaos. Act II — Fix It: patch it the **${courseTitle}** way — proper validation, least privilege, correct headers, you know the drill. Confirm with \`curl -i\` and logs that the hole is sealed. Act III — Own It: write a 10-line check script that would catch this in CI next time — future teammates will worship you. Hint: use \`docker logs\` and \`ss -tulpn\` like a detective. Pro tip: 90% of hacking is just reading error messages more carefully than the developer who wrote them. If you laugh when it breaks and cheer when it’s fixed, you’re doing it right — now go pwn responsibly!`,

    `Ready for some chaos engineering, **${courseTitle}** style? Your quest: make **${title}** fail on purpose. Step 1 — Break: deploy a tiny app (Node/Flask/nginx) and deliberately introduce the flaw from **${title}** — open perms, bad regex, missing auth, whatever fits. Step 2 — Fix: harden it using the remediation steps from this lesson; commit with message "fix: actually secure now, pinky promise." Step 3 — Own: add a one-liner to your pipeline that fails the build if the flaw resurfaces (think \`semgrep\` or \`trufflehog\`). Hint: \`${title.toLowerCase().split(' ')[0]}\` + logs is your friend — search them! Pro tip: the best hackers are just developers who enjoy undo buttons. If your fix survives you furiously trying to re-break it for five minutes, you’ve officially owned it. Gold star and bragging rights unlocked!`,

    `This is your dojo, and **${title}** is today’s kata. Break It: fire up your sandbox and reproduce the classic mistake — copy that sketchy StackOverflow snippet related to **${title}** and watch the app weep. Fix It: refactor using the secure pattern from **${courseTitle}**, add tests that would have caught it, and verify with manual exploitation attempts. Own It: document your war path in a README so your future self (who will forget) can replicate the defense in 30 seconds. Steps: 1) \`git init break-fix-own\` 2) break 3) fix + test 4) automate. Hint: keep \`Burp / ZAP\` or \`curl -v\` open — the truth is in the headers. Pro tip: if your rubber duck says "why would you do that?" you’re learning correctly. Break, fix, own, repeat — that’s how black belts in **${title}** are forged.`,

    `Calling all tinkerers! For **${title}** in **${courseTitle}**, you’ll run the Break-Fix-Own loop. Break: take a clean lab VM and sabotage it — misconfigure, weaken, or bypass the control that **${title}** teaches. Record how it fails — bonus points for dramatic "oh no" screenshots. Fix: apply the textbook defense, tighten configs, validate inputs, and prove the attack now flops with a clean \`nmap\` or app test. Own: turn your fix into a reusable snippet or alias — e.g., \`alias secure-check='bash ~/checks/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.sh'\`. Hint: diff your before/after configs with \`diff -u\` — satisfying and educational. Pro tip: breaking stuff without guilt is the most therapeutic part of cybersecurity — just do it in a VM, not prod, unless you enjoy incident reports and angry Slack messages!`,
  ];
  return pick(variants, h);
}

// ── War Story ~150 words ──
function genWarStory(title: string, courseTitle: string, h: number): string {
  const variants = [
    `Remember Equifax, 2017? Attackers waltzed in via an unpatched Apache Struts flaw — a textbook failure of the exact hygiene **${title}** preaches. The patch had been available for months, but nobody owned the update. 147 million records spilled, the CEO resigned, and the internet collectively facepalmed. The fix was literally in **${courseTitle}** chapter one! The humor? The breach was discovered because someone finally checked a certificate expiry. Lesson: **${title}** isn’t trivia — it’s the difference between "we patched Tuesday" and "we’re on the news forever." If Equifax had a 10-minute weekly **${title}** check, they’d have saved $700 million and a lot of apology letters. So yeah, skim this lesson and you’re basically cosplaying as 2017 Equifax — don’t.`,

    `Let’s talk Log4Shell (CVE-2021-44228) — the gift that kept on giving. A single ` + "`${jndi:ldap://oops}`" + ` in a log line gave attackers RCE on millions of servers — Minecraft, Tesla, you name it. Why does it matter for **${title}** in **${courseTitle}**? Because it was a dependency you didn’t know you had, doing a thing you didn’t know it could do. Teams who understood their supply chain and input handling (hello **${title}**) patched in hours; others played whack-a-mole for weeks. The punchline: the exploit was tweeted as a meme before most SOCs had a detection rule. Lesson: know your stack, validate inputs, and treat every log as hostile — the exact mindset **${title}** drills. Log it, don’t worship it!`,

    `Capital One, 2019 — a classic SSRF meets overly-permissive IAM. An attacker used a web request to trick the server into asking AWS "hey, can I have those creds?" and AWS, being helpful, said "sure!" 100 million records later, everyone learned that cloud misconfig + missing **${title}** fundamentals = very bad day. The attacker even left a GitHub resume. The **${courseTitle}** moral: **${title}** isn’t academic; it’s the lock on the cloud vault door. The fix? Least privilege, egress filtering, and metadata service hardening — all things you’re mastering right now. Funny? The bucket was named "…production." Unfunny? The \$80M fine. Learn **${title}** now, save your future self a very awkward meeting with legal.`,

    `Heartbleed (CVE-2014-0160) — OpenSSL let attackers read 64KB of server memory with a heartbeat that never checked bounds. Passwords, keys, love letters — all bleed out. For **${title}**, it’s a horror story about trusting code that looks boring. The **${courseTitle}** twist: a two-line bounds check would have prevented it. Yet the internet ran vulnerable for two years because "crypto is someone else’s problem." Meme-worthy? People patched by rebooting and hoping. Lesson: **${title}** teaches you to question defaults, validate lengths, and actually read that "boring" library code. Heartbleed bled because nobody asked "what if?" — you will. Wear that paranoia proudly; it’s called defense.`,

    `SolarWinds, 2020 — attackers slipped malware into a trusted update, and 18,000 orgs installed their own backdoor. Why tie it to **${title}**? Because **${courseTitle}** hammers supply-chain and trust boundaries, and SolarWinds was the ultimate betrayal of trust. The joke that wasn’t funny: the malicious DLL was so well-signed it passed every check except "should we audit what we auto-update at 3 AM?" Teams that practiced **${title}** principles — segmentation, signing verification, anomaly detection — caught the beaconing early. Others learned via the news. Lesson: **${title}** is your "trust but verify" superpower. Assume every update could be a Trojan horse — just with better marketing and a valid certificate this time.`,
  ];
  return pick(variants, h);
}

// ── Try It Yourself ~100 words ──
function genLab(title: string, courseTitle: string, labId: string | null, h: number): string {
  const hasLab = !!labId;
  const labRef = hasLab
    ? `You’re in luck — this lesson is wired to a hands-on lab (\`${labId!.slice(0, 8)}…\`). Launch it from **${courseTitle}** → **${title}** and follow the briefing tasks.`
    : `No dedicated lab is wired to this lesson, so use our generic **${courseTitle}** sandbox (any Docker/VM with Kali or remnux-cli will do) — you’ll still get the full **${title}** experience.`;

  const cmds = [
    `Fire up Wireshark or \`tcpdump -i any\`, filter for the traffic tied to **${title}**, and watch the theory come alive. Try \`curl -v http://target/\` and \`nmap -sV\` before and after your fix — diff the outputs and high-five yourself when the weak version fails and the hardened one passes.`,
    `Spin up a container: \`docker run --rm -it remnux/remnux-cli bash\`, then workshop **${title}** with real tools — try \`nikto\`, \`dirb\`, or \`sqlmap --crawl\` if web-ish, or \`linpeas.sh\` / \`ps aux\` if system-ish. Log every command in your notes — future interview you will steal these verbatim.`,
    `Open two terminals: one tails logs (\`journalctl -f\` or \`tail -f /var/log/*.log\`), the other hurls payloads at your test app. Tweak one **${title}** knob at a time, observe, and document. When the exploit flips from success to blocked, you’ve nailed the concept — screenshot it for your portfolio!`,
    `Launch the scenario, then run \`ss -tulpn; iptables -L -v; cat /etc/nginx/nginx.conf\` (or app equivalent) to see **${title}** in the wild. Break one directive, test; fix it, test again. Automation bonus: wrap your check in a tiny \`bash -e\` script so next time it’s one command.`,
  ];

  return `${labRef} ${pick(cmds, h)} Pro tip: keep notes as if you’re writing the walkthrough — clarity is a superpower and makes you look like a pro when you share it with the cohort.`;
}

// ── Brain Teaser riddles ──
function genTeaser(title: string, courseTitle: string, h: number): string {
  const qs = [
    `I’m the **${title}** gatekeeper — I say “no” more than your parents. Skip me and you’re famous on HaveIBeenPwned. What am I?`,
    `You meet me in **${courseTitle}** when you forget **${title}** — I’m the CVE that was patched months ago but still owns your server. Who am I?`,
    `In **${title}**, I’m the tiny check that saves a fortune — a bounds test, a validation, a least-privilege line. I cost one line, save one breach. What am I?`,
    `I love **${title}** so much I put it in CI: I fail your PR when you reintroduce the flaw. I’m annoying and you’ll thank me at 3 AM. What am I?`,
    `For **${title}**, I’m the packet that shouldn’t be there — beacon, exfil, or scan — but your SIEM winks at me. Catch me and you catch the villain. What am I?`,
    `You configure me wrong in **${title}** and I become an open door; configure me right and I’m invisible armor. I live in headers, configs, and IAM. What am I?`,
  ];
  return pick(qs, h);
}

// ── Level Up ~100 words ──
function genLevelUp(title: string, courseTitle: string, h: number): string {
  const variants = [
    `Nail **${title}** and you level up from “I’ve heard of it” to “I can demo it.” This is core **${courseTitle}** muscle — the skill that makes your resume stop being skimmed and start being shortlisted. Next, take it to a bug bounty or harden a real side project; that story is interview gold. Hype check: the next lesson builds directly on **${title}** and unlocks the “I can explain this on a whiteboard without sweating” achievement. Keep the streak — your future senior self is already nodding approvingly while sipping that well-earned coffee.`,

    `Mastering **${title}** is a career cheat code in the **${courseTitle}** track — SOC analyst, pentester, DevSecOps, you pick — they all quiz this. Add it to your toolbox and you suddenly speak fluent "risk mitigation" in stand-ups. What’s next? Chain **${title}** with the upcoming lesson to build a mini kill-chain or defense pipeline you can brag about on LinkedIn (without cringe). The hype is real: each lesson compounds, and you’re one commit away from that "aha!" moment that makes everything click. Stay hungry, stay curious!`,

    `Think of **${title}** as XP that never decays. In **${courseTitle}**, this is the bridge from theory to "I shipped something secure." Employers don’t just want buzzwords — they want someone who broke, fixed, and owned **${title}** and can prove it. Teaser: the next module takes **${title}** and throws you into a scenario that feels like a CTF final — you’ll want this fresh. Keep going; the difference between junior and mid-level is often just one lesson you didn’t skip. This is that lesson.`,

    `You just unlocked a **${courseTitle}** superpower: **${title}**. Put it on your checklist for every code review, every deploy, every "is this safe?" moment — that habit is what turns good engineers into trusted ones. Career impact? Fewer incidents, faster reviews, and that sweet moment when you catch a flaw before prod does. Next up is the perfect sequel — it assumes you own **${title}**, so you’ll glide while others scramble. Hype responsibly, but hype hard — you’re building the kind of depth that pays rent and earns respect.`,

    `Every pro remembers when **${title}** clicked — this could be yours. In the **${courseTitle}** journey, this lesson is the hinge: everything after gets easier because you get the "why" behind the tools. Spin it into a portfolio piece, a blog post, or a lightning talk; teaching **${title}** cements it forever. Next lesson is the boss fight that rewards exactly this prep — come prepared and you’ll style on it. Level up, log your win, and queue the next one — momentum is the real vulnerability (for your old limits).`,
  ];
  return pick(variants, h);
}

async function main() {
  console.log('🚀 Enriching lesson content — target ~2000 words per lesson');
  const lessons = await prisma.lesson.findMany({
    include: { section: { include: { course: true } } },
  });

  let enriched = 0;
  let skipped = 0;

  for (const lesson of lessons) {
    const content = lesson.content ?? '';

    // idempotent — skip already enriched
    if (content.includes('🎯 Your Mission')) {
      skipped++;
      continue;
    }

    const courseTitle = lesson.section.course.title;
    const h = hashTitle(lesson.title, courseTitle);

    const mission = genMission(lesson.title, courseTitle, h);
    const challenge = genChallenge(lesson.title, courseTitle, h + 1);
    const warStory = genWarStory(lesson.title, courseTitle, h + 2);
    const labBlock = genLab(lesson.title, courseTitle, lesson.labId ?? null, h + 3);
    const teaser = genTeaser(lesson.title, courseTitle, h + 4);
    const levelUp = genLevelUp(lesson.title, courseTitle, h + 5);

    const appendix = `\n\n---\n\n## 🎯 Your Mission — ${lesson.title}\n${mission}\n\n## 🔥 Fun Challenge: Break It, Fix It, Own It\n${challenge}\n\n## 💀 War Story: How This Went Wrong IRL\n${warStory}\n\n## 🎮 Try It Yourself — Interactive Lab\n${labBlock}\n\n## 🧠 Quick Brain Teaser\n> **Question:** ${teaser}\n> **Answer:** (hidden — complete the challenge to reveal!)\n\n## 📈 Level Up: What's Next?\n${levelUp}\n`;

    await prisma.lesson.update({
      where: { id: lesson.id },
      data: { content: content + appendix },
    });

    enriched++;
    console.log(`  ✓ enriched: ${lesson.title} (${courseTitle})`);
  }

  console.log('\n=== Enrichment summary ===');
  console.log(`Total lessons: ${lessons.length}`);
  console.log(`Enriched: ${enriched}`);
  console.log(`Skipped (already enriched): ${skipped}`);
}

main()
  .catch((e) => {
    console.error('❌ Enrichment failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
