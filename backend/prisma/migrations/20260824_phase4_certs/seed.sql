INSERT INTO "Certification" (id, name, code, description, requirements, "xpRequired", "isActive", "createdAt")
VALUES
('cert-xca-0000-000000000001', 'XpertClass Certified Associate', 'XCA',
 'Foundation-level certification demonstrating competency across multiple technology domains.',
 '{"minDomains": 3, "minMasteryPerDomain": 70, "minLabsPerDomain": 10, "minAssessments": 1, "crossDomain": false}'::jsonb,
 5000, true, NOW()),
('cert-xcp-0000-000000000002', 'XpertClass Certified Professional', 'XCP',
 'Professional-level certification requiring deep expertise and cross-domain incident response.',
 '{"minDomains": 5, "minMasteryPerDomain": 80, "minLabsPerDomain": 25, "minAssessments": 3, "crossDomain": true, "portfolioReview": true}'::jsonb,
 20000, true, NOW()),
('cert-xce-0000-000000000003', 'XpertClass Certified Expert', 'XCE',
 'Expert-level certification representing mastery across all domains with independent incident resolution.',
 '{"minDomains": 6, "minMasteryPerDomain": 90, "minLabsPerDomain": 50, "minAssessments": 6, "crossDomain": true, "independentIncident": true, "caseStudy": true}'::jsonb,
 50000, true, NOW())
ON CONFLICT (code) DO NOTHING;
