import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EmailService } from './email.service';
import { SubmitInquiryDto } from './dto/submit-inquiry.dto';

@ApiTags('email')
@Controller('v1/inquiries')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  async submitInquiry(@Body() body: SubmitInquiryDto) {
    const record = await this.emailService.createInquiryRecord(body);
    await this.emailService.sendInstitutionInquiry(body);
    await this.emailService.sendInquiryAcknowledgement(body.email, body.name, body.inquiryType).catch(() => {});

    return {
      success: true,
      inquiryId: record.id,
      message: 'Your inquiry has been sent. Our team will get back to you shortly.',
    };
  }
}
