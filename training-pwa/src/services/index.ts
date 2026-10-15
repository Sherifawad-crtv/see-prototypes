import { LocalRepository } from './localRepository.ts';
import { MockTracker, trackerConfig } from './mockTracker.ts';

const localRepository = new LocalRepository();

export const tracker = new MockTracker();
export const repository = localRepository;

export const devTools = {
  trackerConfig,
  clearAllHistory: () => localRepository.clearAll(),
};
