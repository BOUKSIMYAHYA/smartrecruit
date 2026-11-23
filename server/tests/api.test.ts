import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';
import { FileSecurity } from '../src/utils/fileSecurity.js';
import { AiMatchingService } from '../src/services/aiMatching.js';

describe('SmartRecruit ATS API & Security Tests', () => {
  it('GET /api/health should return HEALTHY status and official super admins', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('HEALTHY');
    expect(res.body.superAdmins).toContain('yhykk8899@gmail.com');
    expect(res.body.superAdmins).toContain('saadtoufik67@gmail.com');
  });

  it('GET /api/jobs/public should return published jobs', async () => {
    const res = await request(app).get('/api/jobs/public');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.jobs)).toBe(true);
    expect(res.body.jobs.length).toBeGreaterThan(0);
  });

  it('GET /api/applications/hr/all should reject unauthenticated request', async () => {
    const res = await request(app).get('/api/applications/hr/all');
    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  it('FileSecurity: should validate valid PDF magic bytes and reject invalid files', () => {
    const validPdfBuffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35]); // %PDF-1.5
    const fakeExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00]); // MZ header

    expect(FileSecurity.isValidPdfBuffer(validPdfBuffer)).toBe(true);
    expect(FileSecurity.isValidPdfBuffer(fakeExeBuffer)).toBe(false);
  });

  it('FileSecurity: signed token generation and verification', () => {
    const token = FileSecurity.generateSignedDownloadToken('res-123', '/path/to/resume.pdf', 'user-456');
    expect(token).toBeDefined();

    const decoded = FileSecurity.verifySignedDownloadToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.fileId).toBe('res-123');
    expect(decoded?.userId).toBe('user-456');
  });

  it('AiMatchingService: computes high match for matching candidate profile', async () => {
    const result = await AiMatchingService.matchCandidate(
      {
        jobTitle: 'Développeur Full Stack',
        requiredSkills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
        desiredSkills: ['Docker', 'AWS'],
        requiredExpYears: 3,
      },
      {
        extractedText: 'Senior Full Stack. React, TypeScript, Node.js, PostgreSQL, Docker, AWS.',
        skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
        yearsOfExp: 4,
      }
    );

    expect(result.overallScore).toBeGreaterThanOrEqual(75);
    expect(result.category).toBe('HIGH_MATCH');
    expect(result.recommendation).toBe('APPROVED_FOR_SHORTLIST');
    expect(result.foundRequiredSkills).toContain('React');
    expect(result.foundRequiredSkills).toContain('PostgreSQL');
  });

  it('Dev login: Super Admin gets SUPER_ADMIN role with token', async () => {
    const res = await request(app)
      .post('/api/auth/dev-login')
      .send({ email: 'saadtoufik67@gmail.com' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('SUPER_ADMIN');
  });

  it('Dev login: Candidate user gets CANDIDATE role and cannot access HR routes', async () => {
    const loginRes = await request(app)
      .post('/api/auth/dev-login')
      .send({ email: 'simple.candidate@test.com' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.user.role).toBe('CANDIDATE');

    const hrRes = await request(app)
      .get('/api/applications/hr/all')
      .set('Authorization', `Bearer ${loginRes.body.token}`);

    expect(hrRes.status).toBe(403);
    expect(hrRes.body.error).toContain('Accès refusé');
  });
});
