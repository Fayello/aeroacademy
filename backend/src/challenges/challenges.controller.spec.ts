import { PATH_METADATA } from '@nestjs/common/constants';
import { ChallengesController } from './challenges.controller';

describe('ChallengesController routing', () => {
  it('declares lab challenge routes before generic challenge id routes', () => {
    const routeNames = Object.getOwnPropertyNames(ChallengesController.prototype);
    const mineIndex = routeNames.indexOf('getMyChallenges');
    const sendIndex = routeNames.indexOf('sendChallenge');
    const findOneIndex = routeNames.indexOf('findOne');
    const leaderboardIndex = routeNames.indexOf('getLeaderboard');

    expect(sendIndex).toBeGreaterThan(-1);
    expect(mineIndex).toBeGreaterThan(-1);
    expect(leaderboardIndex).toBeGreaterThan(-1);
    expect(findOneIndex).toBeGreaterThan(-1);
    expect(sendIndex).toBeLessThan(leaderboardIndex);
    expect(mineIndex).toBeLessThan(leaderboardIndex);
    expect(leaderboardIndex).toBeLessThan(findOneIndex);
  });

  it('keeps the mine route as a concrete static path', () => {
    const path = Reflect.getMetadata(
      PATH_METADATA,
      ChallengesController.prototype.getMyChallenges,
    );

    expect(path).toBe('lab-challenges/mine');
  });
});
