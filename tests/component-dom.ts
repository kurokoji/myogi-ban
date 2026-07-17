import { JSDOM } from "jsdom";

export const componentDom = new JSDOM(
  "<!doctype html><html><body></body></html>",
  { url: "http://localhost" },
);

Object.assign(globalThis, {
  window: componentDom.window,
  document: componentDom.window.document,
  HTMLElement: componentDom.window.HTMLElement,
  Element: componentDom.window.Element,
  Node: componentDom.window.Node,
  getComputedStyle: componentDom.window.getComputedStyle,
  requestAnimationFrame: (callback: FrameRequestCallback) =>
    setTimeout(callback, 0),
  cancelAnimationFrame: clearTimeout,
  IS_REACT_ACT_ENVIRONMENT: true,
});
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: componentDom.window.navigator,
});

componentDom.window.matchMedia = () =>
  ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }) as MediaQueryList;
