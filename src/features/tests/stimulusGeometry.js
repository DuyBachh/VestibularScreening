/** Keep the vertical target clear of the instruction at the bottom of the run area.
 * @param {string} id @param {number} width @param {number} height @param {boolean} [preview] */
export function stimulusGeometry(id, width, height, preview = false) {
  const vertical = id === 'vertical-saccades';
  const extent = vertical ? height : width;
  const inset = preview ? 26 : vertical ? 55 : 30;
  return { axis: vertical ? 'translateY' : 'translateX', range: Math.max(0, (Number.isFinite(extent) ? extent : 0) / 2 - inset) };
}
