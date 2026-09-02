import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SubmitInquiryDto } from './dto/submit-inquiry.dto';
import { SubmitCommunityApplicationDto } from './dto/submit-community-application.dto';

@ApiTags('email')
@Controller('v1/inquiries')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async submitInquiry(@Body() body: SubmitInquiryDto) {
    const record = await this.emailService.createInquiryRecord(body);
    await this.emailService.sendInstitutionInquiry(body);
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
  async submitCommunityProgramApplication(
    @Body() body: SubmitCommunityApplicationDto,
  ) {
    const record =
      await this.emailService.createCommunityProgramApplicationRecord(body);
    await this.emailService.sendCommunityProgramApplication(body);
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
