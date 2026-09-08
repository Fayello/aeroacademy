import { OtpService } from './otp.service';

describe('OtpService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prisma = {
    otpVerification: {
      deleteMany: jest.fn().mockResolvedValue({}),
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue({}),
    },
  } as any;

  const service = new OtpService(prisma);

  describe('generate', () => {
    it('returns a 6-digit string', () => {
      const code = service.generate();
      expect(code).toMatch(/^\d{6}$/);
    });

    it('generates different codes on successive calls', () => {
      const codes = new Set(Array.from({ length: 20 }, () => service.generate()));
      expect(codes.size).toBeGreaterThan(1);
    });
  });

  describe('rate limiting', () => {
    it('creates OTP on first request', async () => {
      const code = await service.create('test@example.com', 'verify');
      expect(code).toMatch(/^\d{6}$/);
      expect(prisma.otpVerification.create).toHaveBeenCalled();
    });

    it('blocks rapid repeat requests', async () => {
      prisma.otpVerification.create.mockClear();
      const code = await service.create('test@example.com', 'verify');
      expect(code).toBe('');
      expect(prisma.otpVerification.create).not.toHaveBeenCalled();
    });
  });
});
