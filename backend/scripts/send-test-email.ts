import { EmailService } from '../src/email/email.service';
import { EmailTemplateService } from '../src/email/email-template.service';

async function main() {
  const recipient = process.argv[2];

  if (!recipient) {
    throw new Error('Usage: npm run email:test-send -- recipient@example.com');
  }

  const service = new EmailService({} as never, new EmailTemplateService());
  await service.onModuleInit();

  const sent = await service.sendWelcome(recipient, 'Fayell');

  if (!sent) {
    throw new Error(
      'Email was not sent. Check SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.',
    );
  }

  console.log('Sent branded XpertClass test email to ' + recipient);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
