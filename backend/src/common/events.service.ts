
import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

@Injectable()
export class EventsService {
  private eventSubject = new Subject<{ type: string; payload: any }>();
  events$ = this.eventSubject.asObservable();

  emit(type: string, payload: any) {
    this.eventSubject.next({ type, payload });
  }
}
