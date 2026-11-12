// Verse of the day: Berean Standard Bible (public domain), chosen by the date alone,
// so the same day always shows the same verse. Pure.
import { VERSES } from './data/verses.js';
import { diffDays } from './dates.js';

const EPOCH = '2026-11-12'; // plan day one shows the first verse

export function verseFor(date) {
  const n = VERSES.length;
  return VERSES[((diffDays(EPOCH, date) % n) + n) % n];
}

/** Link to the same reference in the ESV on esv.org (a link only; no ESV text is stored). */
export const esvUrl = (ref) => `https://www.esv.org/${ref.replace(/ /g, '+')}/`;
