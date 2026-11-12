// Small HTML helpers. All text from PLAN.md or from the log goes through esc().

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** Escape, then render PLAN.md's **bold** and `code` markers. */
export const inline = (text) =>
  esc(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '$1');

const plain = (text) => String(text).replace(/\*\*/g, '');

/** Shin status word as a chip. Color is always paired with the word. */
export function shinChip(level) {
  const word = level[0].toUpperCase() + level.slice(1);
  return `<span class="shin-chip shin-${esc(level)}">${esc(word)}</span>`;
}

function renderList(block) {
  const tag = block.t;
  const items = block.items
    .map((item) => {
      const children = item.children
        ? `<ul>${item.children.map((c) => `<li>${inline(c.text)}</li>`).join('')}</ul>`
        : '';
      return `<li>${inline(item.text)}${children}</li>`;
    })
    .join('');
  return `<${tag} class="prose-list">${items}</${tag}>`;
}

/** Tables become stacked rows: a phone has no room for four columns. */
function renderTable(block) {
  const rows = block.rows
    .map((row) => {
      const title = plain(row[0]);
      const isShin = block.head[0] === 'Status' && /^(Green|Yellow|Red)$/.test(title);
      const head = isShin ? shinChip(title.toLowerCase()) : `<strong>${esc(title)}</strong>`;
      const rest = row
        .slice(1)
        .map((cell, i) => {
          if (!cell) return '';
          const label = block.head.length > 2 ? `<span class="cell-label">${esc(plain(block.head[i + 1]))}</span>` : '';
          return `<p>${label}${inline(cell)}</p>`;
        })
        .join('');
      return `<div class="stack-row"><p class="stack-head">${head}</p>${rest}</div>`;
    })
    .join('');
  return `<div class="stack-table">${rows}</div>`;
}

/** Render content blocks from js/data/content.js. */
export function renderBlocks(blocks) {
  return blocks
    .map((block) => {
      if (block.t === 'p') return `<p>${inline(block.text)}</p>`;
      if (block.t === 'ul' || block.t === 'ol') return renderList(block);
      if (block.t === 'table') return renderTable(block);
      return '';
    })
    .join('');
}
