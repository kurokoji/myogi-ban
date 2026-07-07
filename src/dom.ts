export function $(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

export function $id(id: string): HTMLElement | null {
  return document.getElementById(id);
}

export function addClass(el: HTMLElement | null, className: string): void {
  if (!el) return;
  if (!el.className.includes(className)) {
    el.className += el.className ? ` ${className}` : className;
  }
}

export function removeClass(el: HTMLElement | null, className: string): void {
  if (!el) return;
  el.className = el.className.replace(new RegExp(`(^|\\s)${className}(\\s|$)`, 'g'), ' ').trim();
}

export function replaceClass(el: HTMLElement | null, oldClass: string, newClass: string): void {
  if (!el) return;
  if (el.className.includes(oldClass)) {
    el.className = el.className.replace(oldClass, newClass);
  } else {
    addClass(el, newClass);
  }
}

export function toggleClass(el: HTMLElement | null, className: string, force?: boolean): void {
  if (!el) return;
  el.classList.toggle(className, force);
}

export function setStyle(id: string, css: string): void {
  let style = document.getElementById(id) as HTMLStyleElement | null;
  if (style) style.remove();
  style = document.createElement('style');
  style.id = id;
  style.innerHTML = css;
  document.head.appendChild(style);
}

export function removeStyle(id: string): void {
  const style = document.getElementById(id);
  if (style) style.remove();
}
