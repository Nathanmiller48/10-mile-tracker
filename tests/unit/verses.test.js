// Every verse must match the public-domain source file word for word.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { VERSES } from '../../js/data/verses.js';
import { verseFor, esvUrl } from '../../js/verse.js';
import { addDays } from '../../js/dates.js';
import { parseSource, expand, textFor, renderVersesModule, BSB_TXT, VERSES_JS, REFERENCES } from '../../scripts/build-verses.mjs';

const raw = await readFile(BSB_TXT, 'utf8');
const source = parseSource(raw);

test('the source file is the Berean Standard Bible and says it is public domain', () => {
  assert.match(raw.slice(0, 400), /Berean Standard Bible/);
  assert.match(raw.slice(0, 400), /dedicated to the public domain/);
  assert.ok(source.size > 31000, 'the whole Bible is present');
  assert.equal(source.get('Genesis 1:1'), 'In the beginning God created the heavens and the earth.');
});

test('at least 60 verses, no duplicates', () => {
  assert.ok(VERSES.length >= 60, `${VERSES.length} verses`);
  assert.equal(new Set(VERSES.map((v) => v.ref)).size, VERSES.length);
  assert.deepEqual(VERSES.map((v) => v.ref), REFERENCES);
});

test('every verse matches the source file exactly', () => {
  for (const verse of VERSES) {
    const expected = expand(verse.ref).map((ref) => {
      assert.ok(source.has(ref), `${ref} not found in the source`);
      return source.get(ref);
    }).join(' ');
    assert.equal(verse.text, expected, verse.ref);
    assert.equal(verse.text, textFor(verse.ref, source));
    assert.ok(verse.text.length > 20 && verse.text.length < 260, `${verse.ref} is a sensible length`);
    assert.match(verse.text, /^[A-Z“"]/, `${verse.ref} starts a sentence`);
    assert.match(verse.text, /[.!?”"]$/, `${verse.ref} ends a sentence`);
  }
});

test('verses.js is up to date with the build script', async () => {
  const committed = (await readFile(VERSES_JS, 'utf8')).replace(/\r\n/g, '\n');
  assert.equal(committed, renderVersesModule(source), 'js/data/verses.js is stale: run node scripts/build-verses.mjs');
});

test('the verse is chosen by the date alone', () => {
  assert.deepEqual(verseFor('2026-11-17'), verseFor('2026-11-17'));
  assert.equal(verseFor('2026-11-12').ref, VERSES[0].ref);
  assert.notEqual(verseFor('2026-11-17').ref, verseFor('2026-11-18').ref);
  // No repeats inside one full cycle, and dates before the plan still work.
  const cycle = Array.from({ length: VERSES.length }, (_, i) => verseFor(addDays('2026-11-12', i)).ref);
  assert.equal(new Set(cycle).size, VERSES.length);
  assert.ok(verseFor('2026-11-01').ref);
  assert.equal(verseFor(addDays('2026-11-12', VERSES.length)).ref, VERSES[0].ref);
});

test('the reference links to the ESV, and no ESV text is stored', () => {
  assert.equal(esvUrl('Isaiah 40:31'), 'https://www.esv.org/Isaiah+40:31/');
  assert.equal(esvUrl('1 Corinthians 9:26-27'), 'https://www.esv.org/1+Corinthians+9:26-27/');
});
