import { Subject } from 'rxjs';

const subject = new Subject<void>();

export const favoritesChangedEmitter = {
  emit: () => subject.next(),
  subscribe: (listener: () => void) => {
    const sub = subject.subscribe(listener);
    return () => sub.unsubscribe();
  },
};
