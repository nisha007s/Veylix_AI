// Applies the theme before the first paint so there is no flash of the wrong theme.
// A manual choice (stored on this device) wins; otherwise the system setting is used,
// and light is the default when the system has no dark preference.
(function () {
  var theme = "light";
  try {
    var stored = window.localStorage.getItem("veylix-theme");
    if (stored === "light" || stored === "dark") theme = stored;
    else if (window.matchMedia("(prefers-color-scheme: dark)").matches) theme = "dark";
  } catch (e) {
    /* storage unavailable: keep the default */
  }
  if (theme === "dark") document.documentElement.classList.add("dark");
})();
