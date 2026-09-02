import { Body, Controller, Logger, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SubmitInquiryDto } from './dto/submit-inquiry.dto';
import { SubmitCommunityApplicationDto } from './dto/submit-community-application.dto';

@ApiTags('email')
@Controller('v1/inquiries')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async submitInquiry(@Body() body: SubmitInquiryDto) {
    const record = await this.emailService.createInquiryRecord(body);
    this.emailService.sendInstitutionInquiry(body).catch((error: unknown) => {
      this.logger.error(
        `Institution inquiry notification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    });
    await this.emailService
      .sendInquiryAcknowledgement(body.email, body.name, body.inquiryType)
      .catch(() => {});

    return {
      success: true,
      inquiryId: record.id,
      message:
        'Your inquiry has been sent. Our team will get back to you shortly.',
    };
  }

  @Post('/community-programs')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async submitCommunityProgramApplication(
    @Body() body: SubmitCommunityApplicationDto,
  ) {
    const record =
      await this.emailService.createCommunityProgramApplicationRecord(body);
    this.emailService
      .sendCommunityProgramApplication(body)
      .catch((error: unknown) => {
        this.logger.error(
          `Community application notification failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      });
    await this.emailService
      .sendCommunityProgramAcknowledgement(
        body.email,
        body.name,
        body.programType,
      )
      .catch(() => {});

    return {
      success: true,
      applicationId: record.id,
      message:
        'Your application has been received. Our team will review it and contact you shortly.',
    };
  }
}
