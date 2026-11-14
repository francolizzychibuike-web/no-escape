import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateStars,
  isPointInRadius,
  checkAABBCollision,
  getChapterForLevel,
  getInitialProgress,
  recordLevelCompletion,
  DIFFICULTY_MODIFIERS,
} from './rules';

test('getChapterForLevel correctly maps 50 levels to 5 chapters', () => {
  assert.equal(getChapterForLevel(1), 1);
  assert.equal(getChapterForLevel(10), 1);
  assert.equal(getChapterForLevel(11), 2);
  assert.equal(getChapterForLevel(20), 2);
  assert.equal(getChapterForLevel(21), 3);
  assert.equal(getChapterForLevel(30), 3);
  assert.equal(getChapterForLevel(31), 4);
  assert.equal(getChapterForLevel(40), 4);
  assert.equal(getChapterForLevel(41), 5);
  assert.equal(getChapterForLevel(50), 5);
});

test('calculateStars awards 3 stars for zero deaths under par time', () => {
  assert.equal(calculateStars(15, 20, 0, 'normal'), 3);
  assert.equal(calculateStars(25, 20, 1, 'normal'), 2);
  assert.equal(calculateStars(60, 20, 5, 'normal'), 1);
});

test('isPointInRadius detects proximity accurately', () => {
  assert.equal(isPointInRadius([0, 0, 0], [1, 0, 0], 1.5), true);
  assert.equal(isPointInRadius([0, 0, 0], [2, 0, 0], 1.5), false);
});

test('checkAABBCollision checks overlapping boxes accurately', () => {
  // Overlapping
  assert.equal(
    checkAABBCollision([0, 0, 0], [2, 2, 2], [1, 0, 0], [2, 2, 2]),
    true
  );
  // Separated
  assert.equal(
    checkAABBCollision([0, 0, 0], [1, 1, 1], [5, 0, 0], [1, 1, 1]),
    false
  );
});

test('recordLevelCompletion unlocks next level and saves stars', () => {
  const initial = getInitialProgress();
  assert.equal(initial[1].unlocked, true);
  assert.equal(initial[2].unlocked, false);

  const updated = recordLevelCompletion(initial, 1, 18, 20, 0, 'normal');
  assert.equal(updated[1].completed, true);
  assert.equal(updated[1].stars, 3);
  assert.equal(updated[2].unlocked, true);
});

test('difficulty modifiers scale appropriately', () => {
  assert.ok(DIFFICULTY_MODIFIERS.nightmare.damageMultiplier > DIFFICULTY_MODIFIERS.normal.damageMultiplier);
  assert.ok(DIFFICULTY_MODIFIERS.easy.damageMultiplier < DIFFICULTY_MODIFIERS.normal.damageMultiplier);
});
