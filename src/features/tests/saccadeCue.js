/** Anti-Saccade uses side cues only; the initial center is a preparation point.
 * @param {string} id @param {number} previous @param {number} random */
export function nextSaccadeCue(id, previous, random) {
  const choices = (id === 'anti-saccade' ? [-1, 1] : [-1, 0, 1]).filter((value) => value !== previous);
  const index = Math.min(choices.length - 1, Math.max(0, Math.floor((Number.isFinite(random) ? random : 0) * choices.length)));
  return choices[index];
}
