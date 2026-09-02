import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

type Any = any;

export interface CertificationRequirement {
  minDomains: number;
  minMasteryPerDomain: number;
  minLabsPerDomain: number;
  minAssessments: number;
  crossDomain: boolean;
  portfolioReview?: boolean;
  independentIncident?: boolean;
  caseStudy?: boolean;
}

export interface DomainEvaluation {
  domainId: string;
  domainName: string;
  mastery: number;
  labsCompleted: number;
  meetsMastery: boolean;
  meetsLabs: boolean;
}

export interface CertificationEvaluation {
  certificationId: string;
  code: string;
  name: string;
  eligible: boolean;
  domainResults: DomainEvaluation[];
  domainsQualified: number;
  assessmentsPassed: number;
  xp: number;
  missingRequirements: string[];
}

@Injectable()
export class CertificationEngineService {
  constructor(private readonly prisma: PrismaService) {}

  private generateCredentialId(): string {
    return `XCA-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  async evaluateUser(userId: string): Promise<CertificationEvaluation[]> {
    const certifications = await this.prisma.certification.findMany({
      where: { isActive: true },
      orderBy: { xpRequired: 'asc' },
    });

    const domains = await this.prisma.skillDomain.findMany({
      include: {
        learningOutcomes: {
          include: {
            evidence: { where: { userId } },
          },
        },
        skills: {
          include: {
            userSkills: { where: { userId } },
            labSkills: {
              include: {
                lab: {
                  include: {
                    instances: { where: { userId } },
                  },
                },
              },
            },
          },
        },
      },
    });

    // Compute per-domain stats
    const domainStats = domains.map((d) => {
      // Mastery from evidence
      const outcomes = d.learningOutcomes;
      const outcomeScores = outcomes.map((lo) => {
        const scores = lo.evidence.map((e) => e.score);
        return scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      });
      const avgMastery =
        outcomeScores.length > 0
          ? outcomeScores.reduce((a, b) => a + b, 0) / outcomeScores.length
          : 0;

      // Labs completed (unique labs with instances)
      const labIds = new Set(
        d.skills.flatMap((s) =>
          s.labSkills
            .filter((ls) => ls.lab.instances.length > 0)
            .map((ls) => ls.labId),
        ),
      );

      return {
        domainId: d.id,
        domainName: d.name,
        mastery: Math.round(avgMastery * 10) / 10,
        labsCompleted: labIds.size,
      };
    });

    // Count passed assessments
    const passedAssessments = await this.prisma.studentAssessment.count({
      where: {
        userId,
        status: 'COMPLETED',
        score: { gte: 70 },
      },
    });

    // Get user XP
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { xp: true },
    });
    const userXp = user?.xp ?? 0;

    // Evaluate each certification
    return certifications.map((cert) => {
      const req = cert.requirements as unknown as CertificationRequirement;
      const domainResults: DomainEvaluation[] = domainStats.map((ds) => ({
        domainId: ds.domainId,
        domainName: ds.domainName,
        mastery: ds.mastery,
        labsCompleted: ds.labsCompleted,
        meetsMastery: ds.mastery >= req.minMasteryPerDomain,
        meetsLabs: ds.labsCompleted >= req.minLabsPerDomain,
      }));

      const domainsQualified = domainResults.filter(
        (dr) => dr.meetsMastery && dr.meetsLabs,
      ).length;

      const missingRequirements: string[] = [];
      if (domainsQualified < req.minDomains) {
        missingRequirements.push(
          `Need ${req.minDomains - domainsQualified} more domain(s) with ${req.minMasteryPerDomain}%+ mastery and ${req.minLabsPerDomain}+ labs`,
        );
      }
      if (passedAssessments < req.minAssessments) {
        missingRequirements.push(
          `Need ${req.minAssessments - passedAssessments} more passing assessment(s)`,
        );
      }
      if (userXp < cert.xpRequired) {
        missingRequirements.push(
          `Need ${(cert.xpRequired - userXp).toLocaleString()} more XP`,
        );
      }

      const eligible =
        domainsQualified >= req.minDomains &&
        passedAssessments >= req.minAssessments &&
        userXp >= cert.xpRequired;

      return {
        certificationId: cert.id,
        code: cert.code,
        name: cert.name,
        eligible,
        domainResults,
        domainsQualified,
        assessmentsPassed: passedAssessments,
        xp: userXp,
        missingRequirements,
      };
    });
  }

  async awardCertification(
    userId: string,
    certificationCode: string,
  ): Promise<Any> {
    const cert = await this.prisma.certification.findUnique({
      where: { code: certificationCode },
    });
    if (!cert) throw new Error('Certification not found');

    // Check if already awarded
    const existing = await this.prisma.certificationAward.findUnique({
      where: { userId_certificationId: { userId, certificationId: cert.id } },
    });
    if (existing) return existing;

    // Evaluate eligibility
    const evaluations = await this.evaluateUser(userId);
    const evaluation = evaluations.find((e) => e.certificationId === cert.id);
    if (!evaluation || !evaluation.eligible) {
      throw new Error('Not eligible for this certification');
    }

    // Build evidence snapshot
    const evidenceSummary = JSON.parse(
      JSON.stringify({
        evaluatedAt: new Date().toISOString(),
        domainResults: evaluation.domainResults,
        domainsQualified: evaluation.domainsQualified,
        assessmentsPassed: evaluation.assessmentsPassed,
        xp: evaluation.xp,
      }),
    );

    const credentialId = this.generateCredentialId();
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 2); // 2-year validity

    return this.prisma.certificationAward.create({
      data: {
        userId,
        certificationId: cert.id,
        credentialId,
        evidenceSummary,
        expiresAt,
      },
      include: { certification: true },
    });
  }

  async getMyAwards(userId: string) {
    return this.prisma.certificationAward.findMany({
      where: { userId },
      include: {
        certification: true,
        renewals: { orderBy: { renewedAt: 'desc' } },
      },
      orderBy: { awardedAt: 'desc' },
    });
  }

  async getAwardByCredentialId(credentialId: string): Promise<Any> {
    return this.prisma.certificationAward.findUnique({
      where: { credentialId },
      include: {
        certification: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async buildProfessionalRecord(userId: string): Promise<Any> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        division: true,
        xp: true,
        createdAt: true,
      },
    });
    if (!user) throw new Error('User not found');

    // Get domain competency
    const domains = await this.prisma.skillDomain.findMany({
      include: {
        learningOutcomes: {
          include: {
            evidence: { where: { userId } },
          },
        },
      },
    });

    const domainCompetency = domains.map((d) => {
      const outcomes = d.learningOutcomes;
      const scores = outcomes.flatMap((lo) => lo.evidence.map((e) => e.score));
      const avg =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;
      return {
        domainId: d.id,
        name: d.name,
        mastery: Math.round(avg * 10) / 10,
        evidenceCount: scores.length,
      };
    });

    // Labs completed
    const labInstances = await this.prisma.labInstance.findMany({
      where: { userId },
      select: { labId: true },
    });
    const uniqueLabs = new Set(labInstances.map((li) => li.labId));

    // Assessments
    const assessments = await this.prisma.studentAssessment.findMany({
      where: { userId, status: 'COMPLETED' },
      include: {
        assessment: {
          select: { title: true, domain: { select: { name: true } } },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    // Certifications
    const awards = await this.prisma.certificationAward.findMany({
      where: { userId },
      include: { certification: true },
    });

    // Evidence count
    const evidenceCount = await this.prisma.outcomeEvidence.count({
      where: { userId },
    });

    const record = {
      user,
      generatedAt: new Date().toISOString(),
      summary: {
        totalXP: user.xp,
        domainsMastered: domainCompetency.filter((d) => d.mastery >= 80).length,
        totalDomains: domainCompetency.length,
        labsCompleted: uniqueLabs.size,
        assessmentsPassed: assessments.filter((a) => (a.score ?? 0) >= 70)
          .length,
        certificationsEarned: awards.length,
        evidenceCount,
      },
      domainCompetency,
      labs: { completed: uniqueLabs.size },
      assessments: assessments.map((a) => ({
        title: a.assessment.title,
        domain: a.assessment.domain?.name,
        score: a.score,
        completedAt: a.completedAt,
      })),
      certifications: awards.map((a) => ({
        name: a.certification.name,
        code: a.certification.code,
        credentialId: a.credentialId,
        awardedAt: a.awardedAt,
        expiresAt: a.expiresAt,
      })),
    };

    // Upsert professional record
    await this.prisma.professionalRecord.upsert({
      where: { userId },
      update: { data: record, updatedAt: new Date() },
      create: {
        userId,
        data: record,
      },
    });

    return record;
  }

  async getShareableRecord(shareToken: string) {
    const record = await this.prisma.professionalRecord.findUnique({
      where: { shareToken },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    if (!record) return null;
    return record.data;
  }

  async generateShareToken(userId: string): Promise<string> {
    const token = randomBytes(16).toString('hex');
    await this.prisma.professionalRecord.upsert({
      where: { userId },
      update: { shareToken: token },
      create: { userId, shareToken: token, data: {} },
    });
    return token;
  }
}
