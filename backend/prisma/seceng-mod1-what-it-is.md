# Module 1 — Security Engineering: What It Actually Is

Security engineering is the discipline of building systems that remain dependable in the face of malice, error, or mischance. It is not the same as running a vulnerability scanner, responding to alerts at 3 AM, or configuring a firewall. Those are security operations tasks — important, but fundamentally different from what we do as security engineers. Security operations is about keeping the lights on. Security engineering is about designing the building so the lights cannot be easily knocked out.

The distinction matters because organizations that confuse the two end up with expensive monitoring of fundamentally broken architectures. You can instrument a monolithic application with every security tool on the market and still lose customer data because the database had no encryption at rest, no network segmentation, and no access controls beyond a single shared service account. Security engineering prevents that class of problem. Security operations detects it after the fact.

## Security as a Design Property

When security is treated as a design property rather than a bolt-on feature, it changes every decision in the software development lifecycle. Instead of writing code and then asking "how do we secure this?", you ask "what does this system need to protect, and how do we build protection in from the start?"

Consider a real example. A mid-size fintech company built a payment processing API in 2019. The engineering team shipped features fast, and the security team was brought in two weeks before launch to "do a security review." They found that the API accepted card numbers over plaintext HTTP endpoints, stored CVV codes in a flat file for "debugging purposes," and had no rate limiting on authentication endpoints. The fix required a complete architectural rewrite that delayed launch by four months and cost roughly $2.3 million in engineering time and lost revenue.

That story is not unusual. The 2023 Cost of a Data Breach Report found that vulnerabilities introduced in the design phase cost 30x more to remediate than those caught during design. The reason is simple: by the time code is written, documented, integrated with other systems, and deployed, changing fundamental assumptions requires unwinding everything built on top of those assumptions.

Security as a design property means making specific architectural decisions early. It means choosing encryption algorithms before writing the first line of code. It means defining trust boundaries before designing APIs. It means deciding who can access what before building the authorization layer. These decisions are cheap to make when the system exists only on a whiteboard. They become catastrophically expensive after deployment.

## Threat Modeling Fundamentals

Threat modeling is the structured process of identifying what can go wrong in a system. It is the core skill of security engineering because it forces you to think like an attacker before the attackers show up. There are several established methodologies, and a competent security engineer knows when to apply each one.

### STRIDE

STRIDE, developed at Microsoft in the late 1990s, categorizes threats into six types: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege. Each category maps to a security property: spoofing violates authentication, tampering violates integrity, repudiation violates non-repudiation, information disclosure violates confidentiality, denial of service violates availability, and elevation of privilege violates authorization.

The power of STRIDE is its completeness. When you apply STRIDE to a system component, you systematically consider every category of threat. For a login endpoint, you ask: can someone spoof a user? Can the login request be tampered with? Can someone deny they attempted login? Is login information disclosed during transit? Can the login endpoint be overwhelmed? Can a logged-in user escalate privileges?

STRIDE works best when applied to individual components after you have drawn a data flow diagram. You walk through each process, data store, data flow, and trust boundary, asking which STRIDE categories apply to each. This produces a structured list of threats that can be prioritized and addressed.

### PASTA

Process for Attack Simulation and Threat Analysis (PASTA) is a more comprehensive framework that takes an attacker-centric view. Where STRIDE starts from the system and asks "what can go wrong?", PASTA starts from the attacker and asks "what would an attacker try to do, and how?"

PASTA has seven stages: define business objectives, define the technical scope, decompose the application, identify threats, identify vulnerabilities, model attacks, and count risk and impact. The framework explicitly ties technical threats to business impact, which makes it easier to justify security investments to leadership.

PASTA is heavier than STRIDE and works best for high-risk systems where the threat landscape is well-understood. For a standard web application, STRIDE with data flow diagrams gives you 80% of the value at 20% of the effort. For a banking platform or healthcare system, PASTA's rigor is worth the investment.

### Attack Trees

Attack trees, popularized by Bruce Schneier, model attacks as tree structures where the root node is the attacker's goal and the leaf nodes are the specific techniques used to achieve that goal. Each node can have AND or OR relationships with its children — an attacker might need to satisfy all child nodes (AND) or just one (OR).

Attack trees are excellent for visualizing complex attack scenarios and for communicating risk to non-technical stakeholders. When you show a CEO that an attacker has 14 different paths to exfiltrate customer data, and three of those paths require only public information, the conversation about security investment changes dramatically.

Building an effective attack tree requires thinking systematically about the attack surface. Start with the attacker's goal. Then brainstorm the high-level approaches. For each approach, identify the prerequisites. For each prerequisite, identify what the attacker needs to do. Continue until you reach specific, actionable attack techniques. Then evaluate each leaf node for feasibility, cost, and detection likelihood.

## Security Requirements Gathering

Security requirements are not optional add-ons to functional requirements. They are constraints that define how the system must behave under adversarial conditions. Gathering them requires asking specific questions that most product teams never consider.

Start with asset identification. What data does the system handle? What is the sensitivity of that data? A system handling public marketing content has different security requirements than one processing healthcare records. Regulatory requirements drive many security decisions — HIPAA requires specific encryption standards, PCI DSS mandates network segmentation for cardholder data environments, GDPR requires data minimization and the right to erasure.

Move to trust boundaries. Where does the system cross from trusted to untrusted zones? Every API endpoint that accepts external input is a trust boundary. Every database connection crosses a trust boundary. Every integration with a third-party service crosses a trust boundary. Each boundary needs explicit security controls.

Define access control requirements early. Who can access what? How are permissions granted? What happens when a user's role changes? How are service-to-service permissions managed? These questions have architectural implications that cannot be answered after the fact without significant rework.

Availability requirements are security requirements too. A denial of service attack against a critical system is a security incident. Define your availability targets, identify single points of failure, and design redundancy and rate limiting into the architecture from the start.

## Risk Assessment Frameworks

Risk assessment is the process of determining which threats matter most and how much to invest in mitigating them. Several frameworks exist for quantifying and prioritizing risk.

### CVSS

The Common Vulnerability Scoring System assigns a numerical score (0-10) to vulnerabilities based on exploitability and impact. The base score considers attack vector, attack complexity, privileges required, user interaction, scope, confidentiality impact, integrity impact, and availability impact.

CVSS is useful for comparing vulnerabilities against each other, but it has significant limitations. It does not account for the specific context of your environment. A vulnerability scored 9.8 might be irrelevant if the affected component is not deployed, while a vulnerability scored 5.1 might be critical if it exposes your most sensitive data. Always treat CVSS as a starting point, not the final answer.

### DREAD

DREAD (Damage, Reproducibility, Exploitability, Affected Users, Discoverability) uses a qualitative scale to rate threats. Each factor is scored on a 1-10 scale, and the average gives an overall risk rating.

DREAD is simpler than CVSS and works well for internal threat assessments where you are comparing threats against each other rather than communicating with external parties. The subjective nature of the ratings is both its strength (it encourages discussion) and its weakness (different raters produce different scores).

### FAIR

Factor Analysis of Information Risk (FAIR) takes a quantitative approach, estimating risk in financial terms. It models risk as the product of loss event frequency and loss magnitude. FAIR produces ranges rather than point estimates, which is more honest about the uncertainty inherent in risk assessment.

FAIR is the most rigorous framework but also the most resource-intensive. It requires data about threat rates, vulnerability rates, and loss magnitudes that many organizations do not have. For high-stakes decisions — like how much to invest in a security program — FAIR provides the most defensible analysis. For day-to-day prioritization, simpler frameworks suffice.

## The Bank That Lost $10 Million

In 2021, a regional bank in the southeastern United States experienced a breach that compromised the personal information of 340,000 customers. The attackers gained access through a web application vulnerability that had been identified in a penetration test nine months earlier but never remediated because the development team was focused on a feature release.

The initial compromise was straightforward: SQL injection in a customer lookup form that had been added during a rush to meet a regulatory deadline. The form was built by a contractor, never reviewed by the security team, and deployed directly to production. Once inside, the attackers moved laterally through a flat network with no segmentation, accessed a database containing Social Security numbers, account numbers, and transaction histories, and exfiltrated the data over a three-week period using DNS tunneling.

The total cost exceeded $10 million when you account for the regulatory fine ($3.2 million), customer notification and credit monitoring ($1.8 million), forensic investigation ($800,000), legal fees ($2.1 million), and the engineering cost of the subsequent security overhaul ($2.4 million). The bank's stock dropped 12% in the week following disclosure.

The root cause was not a sophisticated attack. It was a design failure. The web application had no input validation framework, no web application firewall, no network segmentation, no data loss prevention, and no monitoring of database access patterns. Every one of these is a security engineering decision that was either never made or made incorrectly.

The bank had a security operations center that monitored for threats 24/7. But the SOC had nothing to monitor — the attack generated no alerts because the exfiltration method (DNS tunneling) was not being detected, and the database access appeared legitimate because the compromised web application used a database account with full read access to the customer table.

This is what happens when security operations runs ahead of security engineering. You build an impressive monitoring capability for a system that was never designed to be monitored, segmented, or defended.

## Building Security Culture

Security culture is not about security awareness training or phishing simulations. Those are useful but insufficient. Security culture is about making security a first-class concern in every engineering decision, every sprint planning session, every architecture review.

The foundation of security culture is shared ownership. When security is "the security team's problem," engineers optimize for features and speed while security optimizes for protection, and the two objectives inevitably conflict. When security is "everyone's problem," engineers internalize security thinking and make better decisions without being told.

Practical steps to build security culture include integrating security requirements into user stories. Instead of writing "as a user, I want to reset my password," write "as a user, I want to reset my password securely, with rate limiting, account lockout after failed attempts, and token expiration within 15 minutes." This forces the security thinking into the design phase rather than treating it as an afterthought.

Security champions programs identify engineers on each team who have an interest in security and give them additional training, early access to security reviews, and a direct line to the security engineering team. These champions become the team's first line of defense, catching security issues during design and code review before they reach the security team.

Threat modeling as a regular practice builds security thinking into the development process. When engineers regularly participate in threat modeling sessions, they start thinking about threats naturally. After six months of monthly threat modeling sessions, most engineering teams will start identifying security issues on their own during design discussions.

Blameless post-incident reviews are essential. When something goes wrong, the question is not "who screwed up?" but "what in our process allowed this to happen, and how do we fix the process?" Fear-based cultures hide problems. Learning cultures expose and fix them.

Finally, leadership must visibly prioritize security. When engineers see that the CTO asks about security in every architecture review, that security work is tracked and prioritized in the backlog, and that security investments are made proactively rather than only after incidents, they internalize the message that security matters.

## The Cost of Ignoring Security Engineering

The financial impact of poor security engineering extends far beyond the immediate cost of a breach. Consider the full lifecycle of a security failure: the initial compromise, the detection (often weeks or months later), the investigation, the containment, the remediation, the notification, the regulatory fines, the legal costs, the lost business, and the long-term reputational damage.

A 2023 study by the Ponemon Institute found that the average cost of a data breach reached $4.45 million, a 15% increase over three years. For breaches involving compromised credentials — the most common attack vector — the average cost was $4.81 million. For breaches in healthcare, the average cost reached $10.93 million. These numbers include direct costs (investigation, remediation, notification) and indirect costs (lost business, customer churn, regulatory penalties).

But the numbers do not capture the full picture. A breach damages trust — customer trust, partner trust, investor trust — and trust is difficult to quantify and slow to rebuild. Companies that suffer breaches experience higher customer churn, lower customer acquisition rates, and reduced ability to command premium pricing. A study by the Harvard Business Review found that companies that experienced data breaches saw a 3.4% decline in stock price in the days following disclosure, with the decline persisting for months.

The root cause of most breaches is not sophisticated attacks. It is preventable engineering failures: unpatched software, misconfigured systems, missing input validation, hardcoded credentials, and flat networks with no segmentation. These are not security operations failures. They are security engineering failures — failures to design, build, and deploy systems that are resilient to the threats they face.

The return on investment for security engineering is measured in incidents prevented. A single prevented breach justifies years of security engineering investment. The challenge is that prevented incidents are invisible — you never see the attack that did not succeed because the system was designed correctly. This makes it difficult to build the business case for security engineering investment, but the evidence is clear: organizations that invest in security engineering experience fewer breaches, lower breach costs, and faster recovery when incidents do occur.

## Security Engineering in the Software Development Lifecycle

Security engineering must be integrated into every phase of the software development lifecycle, not treated as a separate activity that happens at the end.

**Requirements phase:** Security requirements are gathered alongside functional requirements. Threat models are created. Risk assessments are conducted. Security acceptance criteria are defined for each feature.

**Design phase:** Secure design principles are applied. Architecture reviews evaluate the design against security principles. Security controls are specified and integrated into the architecture.

**Implementation phase:** Developers follow secure coding standards. Code reviews include security-focused review. Automated security tools (SAST, SCA) run on every commit.

**Testing phase:** Security testing includes SAST, DAST, SCA, and manual security testing. Penetration testing validates the security of the deployed application. Security regressions are caught before production.

**Deployment phase:** Infrastructure is configured securely. Secrets are managed properly. Monitoring and logging are enabled. Security controls are verified in the deployment environment.

**Operations phase:** Vulnerability management operates continuously. Incident response capabilities are maintained. Security monitoring detects threats. Lessons from incidents feed back into the requirements and design phases.

This integration is not optional. Organizations that treat security as a separate activity — a review at the end, a test before deployment, a scan after launch — consistently experience more security incidents than organizations that integrate security into every phase. The reason is simple: security vulnerabilities introduced early in the lifecycle are cheaper to prevent than vulnerabilities detected late in the lifecycle.

## Assessment

**Lab 1.1 — Threat Model Analysis (45 minutes)**
You are given a system description for an e-commerce platform that handles user accounts, product catalogs, shopping carts, payment processing, and order fulfillment. Using STRIDE, identify at least 15 specific threats across all five components. For each threat, specify the STRIDE category, the affected component, the potential impact, and an initial risk rating (High/Medium/Low).

**Grading criteria:**
- Correct STRIDE categorization (2 points per threat, 30 total)
- Appropriate impact assessment (1 point per threat, 15 total)
- Reasonable risk ratings that consider both likelihood and impact (1 point per threat, 15 total)
- At least one threat per component (5 points)
- Identification of at least two threats involving third-party integrations (5 points)

**Lab 1.2 — Risk Assessment Comparison (30 minutes)**
Given a set of five vulnerabilities with CVSS scores, apply DREAD and FAIR analysis to each. Write a one-page memo explaining why your DREAD and FAIR assessments differ from the CVSS scores and which vulnerabilities you would prioritize for remediation given a limited budget.

**Grading criteria:**
- Correct application of DREAD factors (10 points)
- Reasonable FAIR analysis with identified loss event frequencies and magnitudes (10 points)
- Clear justification for prioritization decisions (15 points)
- Professional memo format appropriate for executive communication (5 points)

**Lab 1.3 — Security Requirements Document (45 minutes)**
Write a security requirements document for a mobile banking application. Include asset classification, trust boundary analysis, access control requirements, encryption requirements, availability requirements, and regulatory compliance requirements. The document should be specific enough that a development team could implement from it.

**Grading criteria:**
- Comprehensive asset identification and classification (10 points)
- Clear trust boundary documentation (10 points)
- Specific, implementable access control requirements (10 points)
- Appropriate encryption requirements with algorithm and key length specifications (10 points)
- Regulatory compliance mapping (10 points)

## Evidence

Security engineering is the foundation upon which all other security disciplines rest. Without sound engineering, operations teams monitor broken systems, incident responders clean up preventable messes, and vulnerability management teams scan for issues that should never have been introduced. The investment in doing security engineering right — in treating security as a design property, in modeling threats before building systems, in gathering security requirements with the same rigor as functional requirements — pays dividends across the entire security program.

The bank that lost $10 million did not lack security tools or security people. It lacked security engineering. The monitoring was there, but the system was not designed to be monitored effectively. The vulnerability scan found the SQL injection, but the system was not designed to prevent injection vulnerabilities. The incident response plan existed, but the network was not designed to limit lateral movement. Every failure was an engineering failure, not an operational one.

Building security culture takes time and commitment, but the alternative is far more expensive. The organizations that get security right are not the ones with the biggest security budgets or the most sophisticated tools. They are the ones where every engineer thinks about security, where threat modeling is a routine part of design, and where security requirements are treated as non-negotiable constraints rather than nice-to-haves.

This course will give you the skills to be that engineer. The modules that follow cover the specific techniques and practices that make security engineering effective: threat modeling, secure design, code review, automation, authentication, cryptography, incident response, vulnerability management, and security architecture. Each builds on the foundation laid here. By the end, you will have the knowledge and practical skills to build systems that are secure by design, not by accident.

## Summary

Security engineering is the discipline of building secure systems, not the discipline of operating security tools. It requires thinking about security during requirements, design, implementation, testing, deployment, and operations. The core competencies include threat modeling, secure design, code review, security automation, authentication and authorization, cryptography, incident response, vulnerability management, and security architecture. Each competency addresses a specific aspect of building secure systems, and together they provide a comprehensive approach to security engineering.

The distinction between security engineering and security operations is fundamental. Security operations monitors and responds to threats against existing systems. Security engineering builds systems that are resilient to threats by design. Both are essential, but security engineering is the foundation upon which security operations operates. Without sound engineering, operations is fighting a losing battle.

The investment in security engineering pays dividends across the entire security program. Systems that are designed securely are easier to monitor, easier to respond to, easier to patch, and easier to recover. The initial investment in security engineering is always less than the cost of addressing security issues after deployment. The bank that lost $10 million spent far more on remediation than it would have spent on secure design. That ratio is the rule, not the exception.