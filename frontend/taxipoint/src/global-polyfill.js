// Global polyfill to fix "global is not defined" error
if (typeof global === 'undefined') {
  window.global = window;
}