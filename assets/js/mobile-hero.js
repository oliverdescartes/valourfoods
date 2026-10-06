(() => {
  const hero = document.querySelector('.liquid-hero');
  if (!hero) return;
  const products = window.valourHeroProducts || [];
  const product = products.find(item => item.featured && !item.placeholder)
    || products.find(item => !item.placeholder);
  if (!product) return;

  const photo = hero.querySelector('[data-hero-photo]');

  hero.dataset.product = product.id;
  hero.querySelector('[data-hero-name]').textContent = product.name;
  hero.querySelector('[data-hero-name]').style.color = product.colour;
  hero.querySelector('[data-hero-description]').textContent = product.description;
  hero.querySelector('[data-hero-facts]').textContent = product.heroFacts;
  photo.style.backgroundColor = product.colour;
  photo.setAttribute('aria-label', product.imageAlt || product.name);

  // Visibility only controls the existing WhatsApp support button.
  if ('IntersectionObserver' in window) {
    new window.IntersectionObserver(([entry]) => {
      document.body.classList.toggle('liquid-hero-in-view', entry.isIntersecting);
    }).observe(hero);
  }

})();
