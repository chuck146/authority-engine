import { interpolate, Easing } from 'remotion'

/**
 * Fade in from 0 to 1 opacity over a given frame range.
 */
export function fadeIn(frame: number, start: number, duration: number): number {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
}

/**
 * Fade out from 1 to 0 opacity over a given frame range.
 */
export function fadeOut(frame: number, start: number, duration: number): number {
  return interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  })
}

/**
 * Slide up from a y offset to 0.
 */
export function slideUp(frame: number, start: number, duration: number, distance = 40): number {
  return interpolate(frame, [start, start + duration], [distance, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.cubic),
  })
}

/**
 * Scale in from a smaller scale to 1.
 */
export function scaleIn(frame: number, start: number, duration: number, from = 0.8): number {
  return interpolate(frame, [start, start + duration], [from, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.out(Easing.back(1.5)),
  })
}

/**
 * Wipe reveal from left to right (0 to 100%).
 */
export function wipeReveal(frame: number, start: number, duration: number): number {
  return interpolate(frame, [start, start + duration], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })
}
