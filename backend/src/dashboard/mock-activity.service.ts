
import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventsService } from '../common/events.service';
import createLogger from '../common/logger';

const logger = createLogger('MockActivity');

@Injectable()
export class MockActivityService implements OnModuleInit {
  private operatives = [
    'Amadou_Dev', 'Fabiola_Sec', 'Eto_Coder', 'Moussa_Tech', 'Ngando_Root', 
    'Awa_Cyber', 'Belinga_Safe', 'Kenfack_Cloud', 'Nana_Security', 'Tcham_Net'
  ];

  private actions = [
    { type: 'FLAG_CAPTURED', templates: ['just finished the task: ', 'successfully completed: ', 'passed the challenge: '] },
    { type: 'ACHIEVEMENT_UNLOCKED', templates: ['earned the badge: ', 'was promoted to: ', 'achieved the rank of: '] }
  ];

  private merits = ['Beginner Learner', 'Security Professional', 'Expert Developer', 'Master Architect'];
  private objectives = ['Intro to API Security', 'Web Vulnerability Lab', 'Database Protection', 'Network Defense'];

  constructor(private eventsService: EventsService) {}

  onModuleInit() {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }
    logger.info('Development mode — starting simulated activity feed');
    this.startSimulation();
  }

  private startSimulation() {
    const scheduleNext = () => {
      const delay = Math.floor(Math.random() * 30000) + 15000;
      setTimeout(() => {
        this.generateActivity();
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  private generateActivity() {
    const operative = this.operatives[Math.floor(Math.random() * this.operatives.length)];
    const action = this.actions[Math.floor(Math.random() * this.actions.length)];
    const template = action.templates[Math.floor(Math.random() * action.templates.length)];
    const target = action.type === 'FLAG_CAPTURED' 
      ? this.objectives[Math.floor(Math.random() * this.objectives.length)]
      : this.merits[Math.floor(Math.random() * this.merits.length)];

    this.eventsService.emit(action.type as any, {
      userId: 'mock-user-id',
      flagTitle: target,
      title: target,
      points: Math.floor(Math.random() * 500) + 100,
      timestamp: new Date().toISOString(),
      messageOverride: `Operative ${operative} ${template} ${target.replace('_', ' ')}`
    });
  }
}
