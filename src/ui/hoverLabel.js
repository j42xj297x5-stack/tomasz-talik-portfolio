export function createHoverLabel() {
  const label = document.createElement('div');
  label.className = 'hover-label';
  label.hidden = true;
  document.body.append(label);

  return {
    show(nodeData, x, y) {
      label.hidden = false;
      label.textContent = nodeData.shortLabel;
      label.style.transform = `translate(${x + 14}px, ${y + 14}px)`;
    },
    hide() {
      label.hidden = true;
    }
  };
}
