# Module 2: Threat Modeling

Threat modeling is the single most valuable activity in security engineering, and it is also the most consistently underutilized. Most organizations do some form of threat modeling, but they do it poorly: a one-time exercise during initial design that is never updated, a compliance checkbox that produces a document no one reads, or a brainstorming session that generates a list of vague threats without actionable mitigations. Effective threat modeling is a continuous, structured process that drives real engineering decisions.

The goal of threat modeling is not to identify every possible threat. That is impossible. The goal is to identify the threats that matter most to your system and your organization, understand the attack surface they target, and make informed decisions about how to mitigate, transfer, accept, or avoid them. A good threat model produces a prioritized list of actionable engineering tasks, not a theoretical document about adversary capabilities.

## STRIDE: A Systematic Approach

STRIDE remains the most practical threat modeling methodology for most systems. Its six categories provide a structured lens through which to examine every component of a system.

**Spoofing** threats involve an attacker pretending to be someone or something they are not. In a web application, this includes credential stuffing against login endpoints, session hijacking through cookie theft, man-in-the-middle attacks on unencrypted connections, DNS spoofing to redirect traffic, and impersonation of service accounts in microservice architectures. Spoofing threats are particularly dangerous because they bypass access controls entirely: if the system cannot distinguish the attacker from a legitimate user, all downstream authorization decisions are compromised.

**Tampering** threats involve unauthorized modification of data. This includes SQL injection that modifies database records, parameter manipulation in API requests, man-in-the-middle modification of messages between services, unauthorized file system modification, and tampering with audit logs to cover tracks. Tampering threats violate data integrity and can have cascading effects: a tampered price in an e-commerce system leads to incorrect invoices, incorrect inventory, and incorrect financial reporting.

**Repudiation** threats involve an attacker denying their actions. If the system does not maintain sufficient audit logs with integrity guarantees, a user can claim they never performed an action that the system recorded. Repudiation threats are particularly critical in financial and healthcare systems where non-repudiation is a legal requirement. A properly designed logging system includes tamper-evident logs, cryptographic signatures on log entries, and independent log storage that the application process cannot modify.

**Information Disclosure** threats involve unauthorized access to data. This includes data exposure through verbose error messages, unencrypted data in transit or at rest, side-channel attacks that leak information through timing or resource consumption, insufficient access controls that expose data to unauthorized users, and data leakage through application responses. Information disclosure threats are the most commonly exploited because they often require the least sophistication to attack.

**Denial of Service** threats involve making a system unavailable to legitimate users. This includes resource exhaustion through unlimited request rates, algorithmic complexity attacks that cause exponential processing time, database locking through concurrent access, memory exhaustion through large payloads, and distributed attacks that overwhelm network or compute resources. DoS threats are often deprioritized because they do not directly compromise data, but for systems where availability is critical (payment processing, healthcare, emergency services), they can be devastating.

**Elevation of Privilege** threats involve gaining capabilities that should not be available. This includes horizontal privilege escalation (accessing another user's data), vertical privilege escalation (gaining administrative access), exploiting missing authorization checks in API endpoints, manipulating role assignments, and exploiting misconfigurations in cloud IAM policies. Elevation of privilege threats are particularly dangerous in multi-tenant systems where tenant isolation is the primary security control.

## Data Flow Diagrams

Data flow diagrams (DFDs) are the foundation of effective threat modeling. A DFD visualizes the system's components, data stores, data flows, and trust boundaries. Without a DFD, threat modeling becomes unfocused brainstorming. With a DFD, you can systematically examine each component and flow for threats.

A DFD uses four primary symbols: processes (circles or rounded rectangles) represent components that transform data, data stores (open-ended rectangles) represent locations where data is persisted, data flows (arrows) represent movement of data between components, and trust boundaries (dashed lines) represent transitions between zones of different trust levels.

The trust boundary is the most important element of a DFD for threat modeling. Every time data crosses a trust boundary, it must be validated, authenticated, and authorized. A trust boundary exists between your application and its users, between your application and external services, between your application and your database, between your internal network and the internet, and between different trust zones within your infrastructure.

Consider a typical three-tier web application. The DFD shows users connecting to a load balancer (trust boundary: internet to DMZ), the load balancer forwarding to web servers (trust boundary: DMZ to application tier), web servers querying an application server (trust boundary: within application tier), and the application server accessing a database (trust boundary: application tier to data tier). Each trust boundary represents an opportunity for security controls.

When drawing a DFD, start with the context level: the entire system as a single process, external entities, and data flows. Then decompose each process into its components. Continue decomposing until you reach the level of detail where threats become apparent. For most systems, three levels of decomposition are sufficient.

## Attack Trees and Attack Graphs

Attack trees model the attacker's perspective by decomposing their goal into sub-goals and specific techniques. An attack tree starts with a root node representing the attacker's objective, then branches into the different approaches the attacker might take. Each approach branches further into specific techniques, prerequisites, and required resources.

Building an attack tree for a specific system requires thinking like the adversary. Start by asking: what is the most valuable target in this system? For a banking application, it might be customer account data. For a healthcare system, it might be patient records. For an e-commerce platform, it might be payment card data.

Then ask: how could an attacker achieve this goal? List the high-level approaches. For the banking application: exploit a web application vulnerability, compromise a user's credentials, compromise an employee's credentials, social engineer an employee, exploit a supply chain dependency, physically access infrastructure.

For each approach, ask: what does the attacker need? What skills do they require? How much does it cost? What is the likelihood of detection? What is the expected payoff?

Attack graphs are similar to attack trees but model the system's state transitions rather than the attacker's goals. An attack graph shows the sequence of states an attacker moves through, from initial access to final objective. This is particularly useful for complex systems where multiple attack paths exist and where the attacker may need to combine several vulnerabilities to achieve their goal.

The distinction between attack trees and attack graphs matters for prioritization. Attack trees help you understand what the attacker wants and how they might get it. Attack graphs help you understand which defensive controls have the most impact by blocking the most attack paths.

## Threat Intelligence Integration

Effective threat modeling incorporates real-world threat intelligence about active adversaries, their techniques, and their targets. This means understanding who might attack your system, what capabilities they have, and what tactics, techniques, and procedures (TTPs) they use.

Threat intelligence sources include government advisories, industry-specific information sharing organizations, open-source intelligence from security research publications, vendor threat reports, and dark web monitoring. The key is to filter intelligence for relevance: a threat report about nation-state actors targeting defense contractors is interesting but irrelevant to a regional healthcare provider, while a report about ransomware groups targeting healthcare is directly actionable.

MITRE ATT&CK provides a structured taxonomy of adversary techniques organized into tactical categories. When you map your threat model to ATT&CK, you can identify which techniques your system is vulnerable to and which defensive controls detect or prevent those techniques. This creates a direct link between your threat model and your detection engineering.

Integrating threat intelligence into threat modeling is an ongoing process, not a one-time activity. Threat landscapes change. New vulnerabilities are discovered. New attack techniques emerge. Your threat model should be a living document that is updated when the threat landscape changes, when your system architecture changes, or when new information becomes available about threats to your industry or technology stack.

## Automated Threat Modeling Tools

Several tools can partially automate threat modeling, though no tool replaces human judgment about what threats matter most to your specific system.

Microsoft Threat Modeling Tool generates threat models from DFDs and applies STRIDE categories to each component. It produces a structured threat list with recommended mitigations. The tool is free and works well for standard web application architectures, but its threat library is limited and it does not account for application-specific logic.

OWASP Threat Dragon is an open-source tool that supports diagram-based threat modeling and integrates with the OWASP threat classification. It generates threats based on the components and flows you draw and provides links to OWASP resources for each threat. It is less mature than commercial alternatives but is constantly improving.

ThreatModeler is a commercial platform that provides more comprehensive threat modeling with industry-specific threat libraries, compliance mapping, and integration with security testing tools. It is expensive but provides significant value for organizations with complex architectures and regulatory requirements.

IriusRisk focuses on automation and integration with development workflows. It can generate threat models from infrastructure-as-code templates, integrate with CI/CD pipelines, and track threat model changes alongside code changes.

The limitation of all automated tools is that they cannot understand your business context, your specific risk tolerance, or the nuances of your architecture that make certain threats more or less relevant. Use these tools to generate a baseline of threats, then apply human judgment to prioritize and refine the results.

## Threat Modeling a Payment Processing System

Consider a payment processing system that handles credit card transactions for e-commerce merchants. The system consists of a merchant-facing API, a payment gateway, a card processing engine, a settlement system, and a reporting dashboard. Data flows include card data submission from merchants, authorization requests to card networks, settlement files to banks, and transaction data to the reporting system.

The first step is drawing the DFD. The merchant API sits in a DMZ, accepting HTTPS connections from merchant servers. The payment gateway processes transactions in an application tier, communicating with the card processing engine over an internal network. The card processing engine connects to external card networks (Visa, Mastercard) over dedicated connections. The settlement system generates daily settlement files transmitted to banks over SFTP. The reporting dashboard accesses a read-only replica of the transaction database.

Trust boundaries appear at several points: between merchant servers and the API (internet to DMZ), between the API and the gateway (DMZ to application tier), between the gateway and the card processing engine (application tier to processing tier), between the card processing engine and external networks (internal to external), and between the reporting dashboard and the database replica (application tier to data tier).

Applying STRIDE to the merchant API: spoofing (attacker impersonates a merchant), tampering (attacker modifies transaction amounts), repudiation (merchant denies submitting a transaction), information disclosure (card data exposed in logs or error messages), DoS (merchant API overwhelmed, blocking legitimate transactions), elevation of privilege (attacker accesses other merchants' data).

Applying STRIDE to the settlement system: spoofing (attacker sends fake settlement files), tampering (attacker modifies settlement amounts), repudiation (bank denies receiving settlement file), information disclosure (settlement data exposed in transit), DoS (settlement process disrupted, delaying fund transfers), elevation of privilege (attacker generates unauthorized settlements).

The most critical threats involve card data handling. PCI DSS requirements mandate specific controls: card numbers must be encrypted in transit and at rest, CVV must never be stored, access to card data must be logged and monitored, and the card data environment must be network-segmented. Threat modeling reveals that the most likely attack vectors are not sophisticated external attacks but insider threats and misconfigurations: a developer accidentally logging card numbers to a debugging service, a misconfigured S3 bucket exposing settlement files, or a compromised service account with excessive database permissions.

Prioritizing these threats requires considering both likelihood and impact. An external attacker exploiting a SQL injection to access the card database is low likelihood (if basic input validation exists) but catastrophic impact. An insider accidentally logging card data is moderate likelihood and moderate impact (limited to the logs). A misconfigured S3 bucket is moderate likelihood and catastrophic impact. The mitigation priorities follow: fix the S3 configuration immediately, implement structured logging that prevents card data from appearing in logs, and add input validation as defense in depth.

## Prioritizing Threats: Likelihood vs Impact

Threat prioritization is where most threat modeling efforts fail. Organizations generate long lists of threats but cannot distinguish between a critical vulnerability that must be fixed immediately and a theoretical risk that is not worth addressing. Effective prioritization requires a framework that considers both likelihood and impact.

Likelihood assessment considers the attacker's motivation, capability, and opportunity. Is your system a likely target for the type of attacker who could exploit this threat? A bank is a likely target for financially motivated attackers. A government agency is a likely target for nation-state actors. A small SaaS startup is unlikely to be targeted by sophisticated adversaries but may be targeted by automated scanning for known vulnerabilities.

Impact assessment considers the consequences if the threat materializes. What data would be compromised? What systems would be affected? What regulatory requirements would be violated? What is the financial cost? What is the reputational damage? Impact assessment must be specific to your organization: a data breach that is inconvenient for a large enterprise may be existential for a startup.

The combination of likelihood and impact produces a risk rating. The specific framework does not matter as much as the consistency of application. Whether you use a 5x5 matrix, a 3x3 matrix, or a quantitative approach like FAIR, the important thing is that you apply the same framework consistently across all threats so that your prioritization is comparable and defensible.

Common prioritization mistakes include anchoring on technical severity without considering business context, treating all threats as equally important, failing to account for existing controls, and ignoring the cost of mitigation. A vulnerability that is technically severe but requires physical access to exploit is lower risk than a vulnerability that is technically moderate but exploitable over the internet by anyone.

## Threat Model Maintenance

A threat model is not a one-time artifact. It is a living document that must be maintained as the system evolves. New features introduce new components, new data flows, and new trust boundaries. Architecture changes alter the attack surface. New threat intelligence reveals attack techniques that were not previously considered. If the threat model is not updated, it becomes stale and eventually irrelevant.

The trigger for threat model updates should be formalized in the development process. A new feature that touches security-sensitive components (authentication, authorization, data storage, external integrations) should trigger a threat model review. An architecture change that alters trust boundaries should trigger a threat model update. A significant security incident should trigger a threat model reassessment.

The maintenance process does not require rebuilding the entire threat model from scratch. It requires identifying what has changed, updating the DFD to reflect the changes, applying STRIDE to the changed components, and updating the prioritized threat list. This incremental approach keeps the threat model current without requiring a massive periodic effort.

Version control for threat models is as important as version control for code. Each version should be tagged with the date, the author, and the changes made. This provides a historical record of how the threat model evolved and why specific decisions were made.

## Common Threat Modeling Pitfalls

Several common mistakes undermine the effectiveness of threat modeling.

**Analysis paralysis:** Spending too much time on threat modeling without producing actionable results. The goal is not to identify every possible threat: it is to identify the threats that matter most and make decisions about how to address them. If a threat modeling session has been running for three hours without producing a prioritized list, it has gone too far.

**Generic threats:** Listing "SQL injection" without specifying where and how it applies to the specific system. Generic threats are not actionable. A threat model should identify specific SQL injection risks in specific components, with specific attack scenarios and specific mitigations.

**Ignoring the human element:** Threat models typically focus on technical threats but ignore social engineering, insider threats, and operational errors. A complete threat model considers the full spectrum of threats, including those that target people rather than systems.

**Threat model as compliance checkbox:** Creating a threat model to satisfy a compliance requirement and then never updating it. A stale threat model is worse than no threat model because it provides a false sense of security.

**Not involving the right people:** Threat modeling performed solely by the security team without input from the development team, architecture team, and operations team. The people who build and operate the system have knowledge that the security team lacks. Effective threat modeling requires cross-functional participation.

**Failing to translate threats into actions:** Producing a list of threats without corresponding mitigations, assignments, and deadlines. A threat model that identifies risks without driving remediation is an academic exercise, not a security engineering practice.

## Assessment

**Lab 2.1: STRIDE Analysis of a REST API (60 minutes)**
You are given a detailed system description of a REST API that handles user registration, authentication, profile management, file uploads, and admin user management. Draw a data flow diagram showing all components, data stores, data flows, and trust boundaries. Then apply STRIDE to each component, identifying at least two threats per STRIDE category (12 minimum). For each threat, provide a specific attack scenario, not a generic description.

**Grading criteria:**
- Correct DFD with all four symbol types and trust boundaries (15 points)
- Correct STRIDE categorization for each threat (12 points, 2 per category)
- Specific, actionable attack scenarios (24 points, 2 per threat)
- Identification of at least three threats involving file upload functionality (9 points)

**Lab 2.2: Attack Tree Construction (45 minutes)**
Construct an attack tree for the goal "exfiltrate user data from the payment processing system described in the module." Include at least four high-level approaches, each with at least three specific techniques. For each leaf node, assign a feasibility rating (Easy/Medium/Hard) and estimate the required attacker capability (script kiddie, competent developer, professional attacker, nation-state).

**Grading criteria:**
- Logical tree structure with appropriate AND/OR relationships (10 points)
- At least four distinct high-level approaches (10 points)
- At least 12 specific techniques total (12 points)
- Reasonable feasibility and capability assessments (13 points)

**Lab 2.3: Threat Model Document (45 minutes)**
Write a complete threat model for the e-commerce platform described in Module 1, Lab 1.1. Include the DFD, STRIDE analysis, attack tree for the most critical threat, prioritized threat list with risk ratings, and recommended mitigations for the top five threats. The document should be clear enough that an engineering team could use it to guide security improvements.

**Grading criteria:**
- Complete DFD with trust boundaries (10 points)
- Comprehensive STRIDE analysis (10 points)
- Attack tree with feasibility assessments (10 points)
- Prioritized threat list with consistent risk ratings (10 points)
- Specific, implementable mitigation recommendations (10 points)

## Evidence

Threat modeling is not a theoretical exercise. It is the process that translates abstract security concerns into concrete engineering tasks. Without threat modeling, security engineering is reactive: you fix things after they break. With threat modeling, you identify what to build securely before you build it, what to test before you deploy, and what to monitor after you launch.

The payment processing example in this module demonstrates why threat modeling requires both structure and judgment. STRIDE provides the structure: it ensures you consider every category of threat against every component. But the prioritization requires judgment: understanding which threats are most likely given your specific system, your specific attackers, and your specific business context. No automated tool can make that judgment for you.

The integration of threat intelligence ensures your threat model reflects the real world, not a theoretical model of it. Attack trees and attack graphs provide the visual and analytical frameworks to understand complex attack scenarios. And the systematic approach to prioritization ensures you spend your limited resources on the threats that matter most.

Effective threat modeling is a skill that improves with practice. The first time you model a system, you will miss threats. The second time, you will catch some of what you missed. By the fifth time, you will start thinking about threats naturally during design discussions. That is the goal: not a document, but a way of thinking about systems that makes them more secure by default.

## Summary

Threat modeling is the systematic process of identifying what can go wrong in a system, assessing the likelihood and impact of those threats, and making informed decisions about how to address them. The core methodologies: STRIDE for systematic threat identification, attack trees for decomposing attacker goals, PASTA for comprehensive risk analysis: provide the structure for effective threat modeling. Data flow diagrams provide the visual foundation that makes systematic analysis possible.

The most important aspect of threat modeling is not the methodology but the outcome. A threat model that produces a prioritized, actionable list of security improvements is valuable regardless of which methodology was used. A threat model that produces a theoretical document without actionable recommendations is useless regardless of how rigorous the methodology was.

Integration of threat intelligence, automated tools, and continuous maintenance transforms threat modeling from a one-time exercise into a continuous security practice. The organizations that do threat modeling well are the ones where security thinking is embedded in the design process, where every architect and engineer thinks about threats naturally, and where the threat model evolves with the system.