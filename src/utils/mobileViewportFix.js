// Fix for 100vh in mobile browsers
export const setVhProperty = () => {
  // First we get the viewport height and we multiply it by 1% to get a value for a vh unit
  const vh = window.innerHeight * 0.01;
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty("--vh", `${vh}px`);
};

// Initialize and add event listener
export const initMobileViewportFix = () => {
  setVhProperty();

  // We listen to the resize event
  window.addEventListener("resize", () => {
    // We execute the same script as before
    setVhProperty();
  });
};
