const { test } = require('node:test');
const assert = require('node:assert/strict');
const HeroCarousel = require('./hero-carousel.js');
function setup(count = 3, initial = 0) {
  let now = 0, id = 0;
  const timers = new Map(), changes = [];
  const clock = {
    setTimeout(fn, delay) { timers.set(++id, { at: now + delay, fn }); return id; },
    clearTimeout(id) { timers.delete(id); }
  };
  const carousel = new HeroCarousel({ count, initial, clock, onChange: i => changes.push(i) });
  carousel.schedule();
  function tick(ms) {
    const end = now + ms;
    while (true) {
      const next = [...timers.entries()].sort((a, b) => a[1].at - b[1].at)[0];
      if (!next || next[1].at > end) break;
      now = next[1].at; timers.delete(next[0]); next[1].fn();
    }
    now = end;
  }
  return { carousel, tick, changes, timers };
}
test('five-second rotation loops across three products from incoming selection', () => {
  const { carousel, tick, changes } = setup(3, 1);
  tick(4999); assert.equal(carousel.index, 1);
  tick(1); assert.equal(carousel.index, 2);
  tick(10000); assert.deepEqual(changes, [2, 0, 1]);
});
test('hold pauses immediately and release starts a fresh five seconds', () => {
  const { carousel, tick } = setup();
  tick(4900); carousel.pause('hold'); tick(20000);
  assert.equal(carousel.index, 0);
  carousel.resume('hold', 5000); tick(4999); assert.equal(carousel.index, 0);
  tick(1); assert.equal(carousel.index, 1);
});
test('manual selection and swipe wait eight seconds then return to five', () => {
  const { carousel, tick } = setup();
  carousel.pause('hold'); carousel.select(2);
  carousel.resume('hold', 8000); tick(7999); assert.equal(carousel.index, 2);
  tick(1); assert.equal(carousel.index, 0);
  tick(5000); assert.equal(carousel.index, 1);
});
test('offscreen, inactive, shopping and explicit pause compose', () => {
  const { carousel, tick, timers } = setup();
  for (const reason of ['offscreen', 'hidden', 'shopping', 'user']) carousel.pause(reason);
  for (const reason of ['offscreen', 'hidden', 'shopping']) carousel.resume(reason);
  tick(60000); assert.equal(carousel.index, 0); assert.equal(timers.size, 0);
  carousel.resume('user', 5000); tick(5000); assert.equal(carousel.index, 1);
});
test('reduced motion blocks autoplay while allowing manual selection', () => {
  const { carousel, tick } = setup();
  carousel.pause('motion'); carousel.select(2); tick(60000);
  assert.equal(carousel.index, 2);
});
test('a single supplied product never rotates', () => {
  const { tick, changes, timers } = setup(1);
  tick(60000); assert.deepEqual(changes, []); assert.equal(timers.size, 0);
});
