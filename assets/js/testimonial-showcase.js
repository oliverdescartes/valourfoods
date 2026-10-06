(() => {
  const section = document.querySelector('#testimonial-showcase');
  if (!section) return;
  const viewport = section.querySelector('[data-showcase-viewport]');
  const track = section.querySelector('[data-showcase-track]');
  const status = section.querySelector('[data-showcase-status]');
  const previous = section.querySelector('[data-showcase-prev]');
  const next = section.querySelector('[data-showcase-next]');
  let cards = [], index = 0, loading = false;
  const cardResizeObserver = 'ResizeObserver' in window
    ? new ResizeObserver(() => update(false)) : null;
  function update(announce = true) {
    cards.forEach((card, i) => {
      let offset = (i - index + cards.length) % cards.length;
      if (offset > cards.length / 2) offset -= cards.length;
      card.style.setProperty('--offset', offset);
      card.style.setProperty('--scale', offset === 0 ? '1' : '.88');
      card.style.setProperty('--turn', `${offset === 0 ? 0 : offset > 0 ? -12 : 12}deg`);
      card.style.opacity = offset === 0 ? '1' : Math.abs(offset) === 1 ? '.55' : '0';
      card.style.zIndex = String(cards.length - Math.abs(offset));
      card.setAttribute('aria-hidden', String(offset !== 0));
      card.inert = offset !== 0;
    });
    if (announce || (!status.textContent && !loading)) status.textContent = cards.length ? `${index + 1} / ${cards.length}` : 'Customer stories are being added.';
    previous.disabled = next.disabled = cards.length < 2;
    // Accommodate long quotes and text enlargement without clipping the card.
    const height = Math.max(0, ...cards.map(card => card.offsetHeight));
    if (height) track.style.height = `${height}px`;
  }
  function select(direction) {
    if (!cards.length) return;
    index = (index + direction + cards.length) % cards.length;
    update();
  }
  const cleanText = value => typeof value === 'string' ? value.trim() : '';
  function validImage(image) {
    if (!image || typeof image.url !== 'string') return false;
    try {
      const url = new URL(image.url, location.origin);
      return url.protocol === 'https:' || (image.url.startsWith('/') && !image.url.startsWith('//') && url.origin === location.origin);
    } catch { return false; }
  }
  function createCard(item, cardIndex, count) {
    const card = document.createElement('article');
    card.className = 'valour-testimonial';
    card.setAttribute('role', 'group');
    card.setAttribute('aria-roledescription', 'slide');
    card.setAttribute('aria-label', `${cardIndex + 1} of ${count}`);
    const media = document.createElement('div');
    media.className = 'valour-testimonial__media';
    media.dataset.imageCount = String(item.images.length);
    item.images.forEach(imageData => {
      const image = new Image();
      if (typeof window.setHomepageMediaSource === 'function') {
        window.setHomepageMediaSource(image, imageData.url, '(max-width: 400px) 86vw, 340px');
      } else image.src = imageData.url;
      image.alt = cleanText(imageData.alt) || 'A VALOUR meal prepared at home';
      image.loading = 'lazy'; image.decoding = 'async'; image.draggable = false;
      if (/^\d{1,3}%\s+\d{1,3}%$/.test(imageData.objectPosition || '')) image.style.objectPosition = imageData.objectPosition;
      image.addEventListener('load', () => update(false), { once: true });
      media.append(image);
    });
    const copy = document.createElement('div');
    copy.className = 'valour-testimonial__copy';
    const quote = document.createElement('blockquote');
    quote.className = 'valour-testimonial__quote';
    quote.textContent = cleanText(item.quote);
    quote.tabIndex = 0;
    const person = document.createElement('p');
    person.className = 'valour-testimonial__person';
    const name = document.createElement('strong');
    name.className = 'valour-testimonial__name';
    name.textContent = cleanText(item.personName);
    const detail = document.createElement('span');
    detail.className = 'valour-testimonial__detail';
    detail.textContent = cleanText(item.personDetail);
    person.append(name, detail);
    copy.append(quote, person);
    // Display a rating only when one is supplied by the database.
    if (Number.isInteger(item.rating) && item.rating >= 1 && item.rating <= 5) {
      const stars = document.createElement('p');
      stars.className = 'valour-testimonial__stars';
      stars.textContent = '\u2605'.repeat(item.rating);
      stars.setAttribute('aria-label', `${item.rating} out of 5 stars`);
      copy.append(stars);
    }
    card.append(media, copy);
    return card;
  }
  const retry = document.createElement('button');
  retry.type = 'button'; retry.className = 'testimonial-showcase__retry';
  retry.textContent = 'Try again'; retry.hidden = true;
  section.querySelector('.testimonial-showcase__controls').append(retry);
  async function loadCards(force = false) {
    if (loading) return;
    loading = true;
    section.setAttribute('aria-busy', 'true');
    retry.hidden = true;
    previous.disabled = next.disabled = true;
    status.textContent = 'Loading customer stories?';
    try {
      const result = !force && typeof window.getHomepageTestimonialsRequest === 'function'
        ? await window.getHomepageTestimonialsRequest()
        : await fetch('/api/homepage-testimonials', { headers: { Accept: 'application/json' } })
          .then(async response => ({ ok: response.ok, payload: await response.json() }));
      if (!result.ok || !result.payload?.ok || !Array.isArray(result.payload.items)) throw new Error('Testimonials unavailable');
      const items = result.payload.items.map(item => ({
        ...item,
        images: (Array.isArray(item?.images) ? item.images : []).filter(validImage).slice(0, 3)
      })).filter(item => cleanText(item.quote) && cleanText(item.personName) && item.images.length);
      cardResizeObserver?.disconnect();
      cards = items.map((item, i) => createCard(item, i, items.length));
      index = Math.min(index, Math.max(0, cards.length - 1));
      track.replaceChildren(...cards);
      track.style.height = '';
      cards.forEach(card => cardResizeObserver?.observe(card));
      viewport.hidden = cards.length === 0;
      update();
    } catch {
      status.textContent = 'Customer stories are temporarily unavailable.';
      viewport.hidden = cards.length === 0;
      retry.hidden = false;
    } finally {
      loading = false;
      section.setAttribute('aria-busy', 'false');
    }
  }
  retry.addEventListener('click', () => loadCards(true));
  previous.addEventListener('click', () => select(-1));
  next.addEventListener('click', () => select(1));
  viewport.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') { index = 0; update(); }
    else if (event.key === 'End') { index = Math.max(0, cards.length - 1); update(); }
    else select(event.key === 'ArrowRight' ? 1 : -1);
  });
  let start;
  viewport.addEventListener('pointerdown', event => { start = { id: event.pointerId, x: event.clientX, y: event.clientY }; });
  window.addEventListener('pointerup', event => {
    if (!start || start.id !== event.pointerId) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    start = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) select(dx < 0 ? 1 : -1);
  });
  window.addEventListener('pointercancel', () => { start = null; });
  if ('ResizeObserver' in window) new ResizeObserver(() => update(false)).observe(viewport);
  document.fonts?.ready.then(() => update(false));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      observer.disconnect();
      loadCards();
    }, { rootMargin: '700px 0px' });
    observer.observe(section);
  } else loadCards();
})();
