// Minimal runtime CSS rule manager. Allows components to upsert dynamic CSS rules
// without using inline `style` attributes on elements.
const rules = new Map<string, string>();

function ensureStyleElement() {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById('app-dynamic-styles') as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = 'app-dynamic-styles';
    document.head.appendChild(el);
  }
  return el;
}

export function upsertRule(id: string, css: string) {
  rules.set(id, css);
  const el = ensureStyleElement();
  if (el) {
    el.textContent = Array.from(rules.values()).join('\n');
  }
}

export function removeRule(id: string) {
  rules.delete(id);
  const el = ensureStyleElement();
  if (el) el.textContent = Array.from(rules.values()).join('\n');
}

export function clearRules() {
  rules.clear();
  const el = ensureStyleElement();
  if (el) el.textContent = '';
}

const dynamicStyles = { upsertRule, removeRule, clearRules };
export default dynamicStyles;
