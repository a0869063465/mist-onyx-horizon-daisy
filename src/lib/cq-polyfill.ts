/**
 * Safari older than 16 (old iPads) knows neither container query units nor dvh. The stylesheet and the inline styles
 * therefore read `var(--cqw|--cqh|--cqmin|--dvh1)`: modern browsers resolve those to the real units (see :root in
 * styles.css), and this file fills them in by hand where the real ones are missing.
 */
const BOXES = new Map<Element, ResizeObserver>();

const forced = () => typeof location !== "undefined" && /[?&]cqtest\b/.test(location.search);
const supportsCq = () => !forced() && typeof CSS !== "undefined" && CSS.supports?.("width", "1cqw");
const supportsDvh = () => !forced() && typeof CSS !== "undefined" && CSS.supports?.("height", "1dvh");

function trackViewport() {
  const root = document.documentElement;
  const apply = () => root.style.setProperty("--dvh1", `${window.innerHeight / 100}px`);
  apply();
  window.addEventListener("resize", apply);
  window.addEventListener("orientationchange", apply);
}

function typeOf(el: Element): string {
  return getComputedStyle(el).getPropertyValue("--cq-type").trim();
}

function measure(el: HTMLElement, type: string) {
  const css = getComputedStyle(el);
  const inner = (a: string, b: string) => parseFloat(css.getPropertyValue(a)) + parseFloat(css.getPropertyValue(b)) || 0;
  const width = (el.clientWidth - inner("padding-left", "padding-right")) / 100;
  let height = (el.clientHeight - inner("padding-top", "padding-bottom")) / 100;
  if (type !== "size") {
    // An inline-size container leaves cqh to the container above it.
    const above = el.parentElement ? parseFloat(getComputedStyle(el.parentElement).getPropertyValue("--cqh")) : NaN;
    height = Number.isFinite(above) && above > 0 ? above : window.innerHeight / 100;
  } else {
    el.style.setProperty("--cqh", `${height}px`);
  }
  el.style.setProperty("--cqw", `${width}px`);
  el.style.setProperty("--cqmin", `${Math.min(width, height)}px`);
}

function watch(el: Element) {
  if (BOXES.has(el) || !(el instanceof HTMLElement)) return;
  const type = typeOf(el);
  if (type !== "size" && type !== "inline-size") return;
  const observer = new ResizeObserver(() => measure(el, type));
  BOXES.set(el, observer);
  observer.observe(el);
  measure(el, type);
}

function selectors(): string[] {
  const found: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      const style = rule as CSSStyleRule;
      if (style.selectorText && style.style?.getPropertyValue("--cq-type")) found.push(style.selectorText);
    }
  }
  return found;
}

export function installContainerFallback() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (!supportsDvh()) trackViewport();
  if (supportsCq()) return;
  const root = document.documentElement;
  const sync = () => {
    root.style.setProperty("--cqw", `${window.innerWidth / 100}px`);
    root.style.setProperty("--cqh", `${window.innerHeight / 100}px`);
    root.style.setProperty("--cqmin", `${Math.min(window.innerWidth, window.innerHeight) / 100}px`);
  };
  sync();
  window.addEventListener("resize", sync);
  let list: string[] = [];
  const scan = (node: ParentNode) => {
    for (const selector of list) {
      try {
        if (node instanceof Element && node.matches(selector)) watch(node);
        node.querySelectorAll(selector).forEach(watch);
      } catch {
        // A selector this browser cannot run is skipped.
      }
    }
  };
  const start = () => {
    list = selectors();
    scan(document);
  };
  new MutationObserver((records) => {
    for (const record of records) record.addedNodes.forEach((node) => node instanceof Element && scan(node));
    for (const el of Array.from(BOXES.keys())) {
      if (!el.isConnected) {
        BOXES.get(el)?.disconnect();
        BOXES.delete(el);
      }
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "complete") start();
  else window.addEventListener("load", start, { once: true });
  // The stylesheet may arrive after hydration begins; look again shortly.
  window.setTimeout(start, 600);
}
