/** A short vibration where supported, only after the user has interacted (browsers block it before). */
export const haptic = (pattern: number | number[]) => {
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  navigator.vibrate?.(pattern);
};
