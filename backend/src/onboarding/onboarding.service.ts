import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventsService } from '../common/events.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OnboardingService implements OnModuleInit {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(
    private eventsService: EventsService,
    private emailService: EmailService,
  ) {}

  onModuleInit() {
    this.eventsService.events$.subscribe((event) => {
      if (event.type === 'USER_REGISTERED') {
        const { email, name } = event.payload as {
          email: string;
          name: string | null;
        };
        this.logger.log(`USER_REGISTERED event received for ${email}`);
        this.emailService.sendWelcome(email, name).catch(() => {});
      }
    });
  }
}
