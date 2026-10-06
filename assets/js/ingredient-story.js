(() => {
  const story = document.querySelector('#know-your-ingredients');
  if (!story) return;

  const targets = [...story.querySelectorAll('[data-story-reveal]')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pending = new Set(targets);
  let observer = null;

  function reveal(target) {
    target.classList.add('is-revealed');
    pending.delete(target);
    observer?.unobserve(target);
  }

  function showWithoutMotion() {
    observer?.disconnect();
    observer = null;
    story.classList.remove('has-motion');
    targets.forEach(reveal);
  }

  function configureMotion() {
    observer?.disconnect();
    observer = null;

    if (motion.matches || !('IntersectionObserver' in window)) {
      showWithoutMotion();
      return;
    }

    if (!pending.size) return;

    try {
      observer = new window.IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) reveal(entry.target);
        });
        if (!pending.size) {
          observer?.disconnect();
          observer = null;
        }
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

      story.classList.add('has-motion');
      pending.forEach(target => observer.observe(target));
    } catch {
      showWithoutMotion();
    }
  }

  configureMotion();
  if (motion.addEventListener) motion.addEventListener('change', configureMotion);
  else motion.addListener?.(configureMotion);
})();
