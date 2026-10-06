const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const script = fs.readFileSync(`${__dirname}/testimonial-showcase.js`, 'utf8');
class Element {
  constructor() {
    this.children = []; this.attrs = {}; this.dataset = {}; this.events = {};
    this.style = { setProperty() {} }; this.offsetHeight = 600; this.textContent = '';
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
  setAttribute(key, value) { this.attrs[key] = value; }
  addEventListener(key, fn) { this.events[key] = fn; }
}
const item = i => ({ key: `customer-${i}`, quote: `Customer quote ${i}`, personName: `Customer ${i}`, personDetail: 'Agartala', images: [{ url: `/images/${i}.webp` }] });
async function run(items, ok = true) {
  const section = new Element();
  const nodes = Object.fromEntries(['viewport', 'track', 'status', 'prev', 'next'].map(key => [`[data-showcase-${key}]`, new Element()]));
  nodes['.testimonial-showcase__controls'] = new Element();
  section.querySelector = selector => nodes[selector];
  const window = { addEventListener() {}, getHomepageTestimonialsRequest: async () => ({ ok, payload: { ok, items } }) };
  vm.runInNewContext(script, { window, document: { querySelector: () => section, createElement: () => new Element() }, Image: Element, URL, location: { origin: 'https://liquidspice.in' } });
  await new Promise(resolve => setImmediate(resolve));
  return { section, nodes, cards: nodes['[data-showcase-track]'].children };
}
for (const count of [1, 5, 8]) test(`renders ${count} database records with matching navigation`, async () => {
  const { nodes, cards } = await run(Array.from({ length: count }, (_, i) => item(i)));
  assert.equal(cards.length, count);
  assert.equal(nodes['[data-showcase-status]'].textContent, `1 / ${count}`);
  assert.equal(cards[0].children[0].dataset.imageCount, '1');
  assert.equal(nodes['[data-showcase-next]'].disabled, count === 1);
  nodes['[data-showcase-prev]'].events.click();
  assert.equal(nodes['[data-showcase-status]'].textContent, `${count} / ${count}`);
});
test('empty database shows an empty state without invented cards', async () => {
  const { nodes, cards } = await run([]);
  assert.equal(cards.length, 0);
  assert.equal(nodes['[data-showcase-viewport]'].hidden, true);
  assert.equal(nodes['[data-showcase-next]'].disabled, true);
});
test('filters incomplete records and unsafe images; keeps image groups together', async () => {
  const grouped = { ...item(1), images: [{ url: '/one.webp' }, { url: 'https://media.liquidspice.in/two.webp' }] };
  const { cards } = await run([grouped, { ...item(2), quote: '' }, { ...item(3), images: [{ url: 'javascript:alert(1)' }] }]);
  assert.equal(cards.length, 1);
  assert.equal(cards[0].children[0].dataset.imageCount, '2');
  assert.equal(cards[0].attrs['aria-label'], '1 of 1');
});
test('API failure offers retry without substituting static testimonials', async () => {
  const { nodes, cards } = await run([], false);
  assert.equal(cards.length, 0);
  assert.equal(nodes['.testimonial-showcase__controls'].children[0].hidden, false);
  assert.match(nodes['[data-showcase-status]'].textContent, /temporarily unavailable/);
});
