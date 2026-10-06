/* Timing is independent of rendering so every pause reason composes safely. */
(function (root) {
  class HeroCarousel {
    constructor({ count, initial = 0, onChange, clock = globalThis }) {
      this.count = count;
      this.index = initial;
      this.onChange = onChange;
      this.clock = clock;
      this.pauses = new Set();
      this.delay = 5000;
      this.timer = null;
    }
    schedule(delay = this.delay) {
      this.clock.clearTimeout(this.timer);
      this.timer = null;
      this.delay = delay;
      if (this.count < 2 || this.pauses.size) return;
      this.timer = this.clock.setTimeout(() => {
        this.select(this.index + 1, false);
      }, delay);
    }
    select(index, manual = true) {
      if (!this.count) return;
      this.index = (index + this.count) % this.count;
      this.onChange(this.index, manual);
      this.schedule(manual ? 8000 : 5000);
    }
    pause(reason) {
      this.pauses.add(reason);
      this.clock.clearTimeout(this.timer);
      this.timer = null;
    }
    resume(reason, delay = this.delay) {
      this.pauses.delete(reason);
      this.schedule(delay);
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = HeroCarousel;
  else root.ValourHeroCarousel = HeroCarousel;
})(globalThis);
