#!/usr/bin/env node
/**
 * One-shot ingest of public CYC26 pages into data/*.json.
 * Tools never call this at runtime.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data');
const BASE = 'https://www.commityourcode.com';

function decode(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/<!-- -->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugFromHref(href) {
  return href.replace(/^\/speakers\//, '').replace(/^\/sessions\//, '');
}

function photoFromSrc(src) {
  const match = src.match(/url=([^&]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

function parseJsonLd(html) {
  const blocks = [];
  const re = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html))) {
    try {
      blocks.push(JSON.parse(match[1]));
    } catch {
      // ignore malformed
    }
  }
  return blocks.flatMap((block) => (Array.isArray(block) ? block : [block]));
}

function classAttr(html, className) {
  const re = new RegExp(
    `<(?:p|h3|h2|h1|span|div)[^>]*class="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)</(?:p|h3|h2|h1|span|div)>`,
    'i'
  );
  const match = html.match(re);
  return match ? decode(match[1].replace(/<[^>]+>/g, '')) : '';
}

function parseSpeakers(html) {
  const speakers = [];

  const featured = html.match(
    /<a class="SpeakerGrid_featured[^"]*" href="(\/speakers\/[^"]+)">([\s\S]*?)<\/a>/
  );
  if (featured) {
    const slug = slugFromHref(featured[1]);
    const block = featured[2];
    const img = block.match(/src="([^"]+)"/);
    speakers.push({
      id: slug,
      slug,
      sequence: 1,
      isKeynote: true,
      name: classAttr(block, 'SpeakerGrid_featuredName') || 'Kevin J. Scott',
      title: classAttr(block, 'SpeakerGrid_featuredRole'),
      company: classAttr(block, 'SpeakerGrid_featuredCompany'),
      track: 'Keynote',
      talkTitle: decode(
        (block.match(
          /<div class="SpeakerGrid_featuredSession[^"]*">[\s\S]*?<p>([^<]+)<\/p>/
        ) || [])[1] || 'Keynote'
      ),
      photoUrl: img ? photoFromSrc(img[1]) : null,
      url: `${BASE}/speakers/${slug}`,
    });
  }

  const cardRe =
    /<a class="SpeakerGrid_card[^"]*" href="(\/speakers\/[^"]+)">([\s\S]*?)<\/a>/g;
  let match;
  while ((match = cardRe.exec(html))) {
    const slug = slugFromHref(match[1]);
    const block = match[2];
    const img = block.match(/src="([^"]+)"/);
    const seq = block.match(/SpeakerGrid_sequence[^"]*"[^>]*>(\d+)/);
    const occupation = classAttr(block, 'SpeakerGrid_occupation');
    const [title, ...companyParts] = occupation.split(' / ');
    speakers.push({
      id: slug,
      slug,
      sequence: seq ? Number(seq[1]) : speakers.length + 1,
      isKeynote: false,
      name: classAttr(block, 'SpeakerGrid_name'),
      title: decode(title || ''),
      company: decode(companyParts.join(' / ')),
      track: classAttr(block, 'SpeakerGrid_track') || 'CYC26',
      talkTitle: decode(
        (block.match(
          /<div class="SpeakerGrid_session[^"]*">[\s\S]*?<p>([^<]+)<\/p>/
        ) || [])[1] || ''
      ),
      photoUrl: img ? photoFromSrc(img[1]) : null,
      url: `${BASE}/speakers/${slug}`,
    });
  }

  return speakers;
}

function parseSessionHrefs(html) {
  return [...new Set([...html.matchAll(/href="(\/sessions\/[^"]+)"/g)].map((m) => m[1]))];
}

function parseEvents(html) {
  const events = [];
  const seen = new Set();
  const headingRe = /<h3[^>]*>([\s\S]*?)<\/h3>/g;
  let match;
  while ((match = headingRe.exec(html))) {
    const title = decode(match[1].replace(/<[^>]+>/g, ''));
    if (!title.startsWith('Day[') && !title.startsWith('Closing')) continue;
    if (seen.has(title)) continue;
    seen.add(title);
    const after = html.slice(match.index, match.index + 2500);
    const when = (after.match(/September [^<]{5,60}/) || [])[0] || '';
    const descMatch = after.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    events.push({
      id: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
      title,
      when: decode(when),
      description: descMatch
        ? decode(descMatch[1].replace(/<[^>]+>/g, ''))
        : '',
      url: `${BASE}/events`,
    });
  }
  return events;
}

function dayFromIso(iso) {
  if (!iso) return null;
  const date = iso.slice(0, 10);
  if (date === '2026-09-02') return 0;
  if (date === '2026-09-03') return 1;
  if (date === '2026-09-04') return 2;
  return null;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'cyc2026-mcp-app-ingest/1.0' },
  });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function normalizeTrack(raw) {
  const value = (raw || '').trim();
  const lower = value.toLowerCase();
  if (lower.includes('keynote')) return 'Keynote';
  if (lower === 'ai' || lower.includes('artificial')) return 'AI';
  if (lower.includes('cloud')) return 'Cloud';
  if (lower.includes('java') && !lower.includes('script')) return 'Java';
  if (lower.includes('javascript') || lower.includes('frontend') || lower === 'js')
    return 'JavaScript';
  if (lower.includes('leadership') || lower.includes('startup') || lower.includes('entrepreneur'))
    return 'Leadership';
  if (lower.includes('workshop')) return 'Workshops';
  return value || 'CYC26';
}

const TRACKS = [
  {
    id: 'ai',
    name: 'Artificial Intelligence',
    shortName: 'AI',
    color: '#0868f7',
    blurb: 'Production AI from engineers who ship, not hype decks.',
  },
  {
    id: 'cloud',
    name: 'Cloud & Infrastructure',
    shortName: 'Cloud',
    color: '#0ea5e9',
    blurb: 'Architecture, pipelines, and strategies that survive scale.',
  },
  {
    id: 'javascript',
    name: 'Fullstack JavaScript',
    shortName: 'JavaScript',
    color: '#079455',
    blurb: 'React, Node, and performance, straight from framework contributors.',
  },
  {
    id: 'java',
    name: 'Java',
    shortName: 'Java',
    color: '#f97316',
    blurb: 'Spring, enterprise architecture, and battle-tested backend patterns.',
  },
  {
    id: 'leadership',
    name: 'Entrepreneurship & Leadership',
    shortName: 'Leadership',
    color: '#7c3aed',
    blurb: 'Side project to real company, from founders who have done it.',
  },
  {
    id: 'workshops',
    name: '90-Minute Workshops',
    shortName: 'Workshops',
    color: '#ef4444',
    blurb: 'Build something real. Leave with working code.',
  },
  {
    id: 'keynote',
    name: 'Keynote',
    shortName: 'Keynote',
    color: '#0868f7',
    blurb: 'Main-stage sessions for the whole conference.',
  },
];

const ROOMS = [
  { id: '1d', name: 'Room 1D', color: '#ec4899' },
  { id: '2a', name: 'Room 2A', color: '#0868f7' },
  { id: '2b', name: 'Room 2B', color: '#079455' },
  { id: '2c', name: 'Room 2C', color: '#f97316' },
  { id: '2d', name: 'Room 2D', color: '#ef4444' },
  { id: '2e', name: 'Room 2E', color: '#7c3aed' },
];

async function main() {
  console.log('Fetching /speakers, /agenda, /events…');
  const [speakersHtml, agendaHtml, eventsHtml] = await Promise.all([
    fetchText(`${BASE}/speakers`),
    fetchText(`${BASE}/agenda`),
    fetchText(`${BASE}/events`),
  ]);

  const speakers = parseSpeakers(speakersHtml);
  console.log(`Parsed ${speakers.length} speakers`);

  const sessionHrefs = parseSessionHrefs(agendaHtml);
  console.log(`Found ${sessionHrefs.length} unique session URLs`);

  const socialEvents = parseEvents(eventsHtml);

  console.log('Fetching speaker detail pages…');
  await mapLimit(speakers, 8, async (speaker) => {
    try {
      const html = await fetchText(speaker.url);
      const ld = parseJsonLd(html).find((item) => item['@type'] === 'Person');
      if (ld) {
        speaker.bio = ld.description || '';
        speaker.title = decode(ld.jobTitle || speaker.title);
        speaker.company = ld.worksFor?.name || speaker.company;
        speaker.photoUrl = ld.image || speaker.photoUrl;
        speaker.sessionIds = (ld.performerIn || [])
          .map((item) => {
            const id = typeof item === 'string' ? item : item['@id'];
            if (!id) return null;
            const m = id.match(/\/sessions\/([^#]+)/);
            return m ? m[1] : null;
          })
          .filter(Boolean);
      }
      const sessionHref = html.match(/href="(\/sessions\/[^"]+)"/);
      if (sessionHref && (!speaker.sessionIds || speaker.sessionIds.length === 0)) {
        speaker.sessionIds = [slugFromHref(sessionHref[1])];
      }
    } catch (err) {
      console.warn(`speaker ${speaker.id}: ${err.message}`);
      speaker.bio = speaker.bio || '';
      speaker.sessionIds = speaker.sessionIds || [];
    }
    speaker.track = normalizeTrack(speaker.track);
  });

  console.log('Fetching session detail pages…');
  const sessions = [];
  await mapLimit(sessionHrefs, 8, async (href) => {
    const id = slugFromHref(href);
    const url = `${BASE}${href}`;
    try {
      const html = await fetchText(url);
      const ld = parseJsonLd(html).find(
        (item) => item['@type'] === 'EducationEvent' || item['@type'] === 'Event'
      );
      const roomName = ld?.location?.name?.replace(/, Capital One Campus$/, '') || '';
      const speakersForSession = (ld?.performer || []).map((person) => {
        const speakerUrl = person.url || '';
        const slug = speakerUrl.split('/speakers/')[1] || '';
        return {
          id: slug,
          name: person.name,
        };
      });
      const trackFromPage =
        (html.match(/font-mono text-sm font-bold[^>]*>([^<]+)</) || [])[1] || '';
      sessions.push({
        id,
        slug: id,
        title: decode(ld?.name || id),
        abstract: decode(ld?.description || ''),
        track: normalizeTrack(trackFromPage),
        room: decode(roomName),
        start: ld?.startDate || null,
        end: ld?.endDate || null,
        day: dayFromIso(ld?.startDate),
        isSocial: /pickleball|truck yard|morning connect|after party|closing|networking|welcome/i.test(
          ld?.name || id
        ),
        speakers: speakersForSession,
        url,
      });
    } catch (err) {
      console.warn(`session ${id}: ${err.message}`);
    }
  });

  sessions.sort((a, b) => String(a.start).localeCompare(String(b.start)));

  const days = [0, 1, 2].map((day) => {
    const items = sessions.filter((session) => session.day === day);
    const slotMap = new Map();
    for (const session of items) {
      const key = `${session.start}|${session.end}`;
      if (!slotMap.has(key)) {
        slotMap.set(key, {
          start: session.start,
          end: session.end,
          sessionIds: [],
        });
      }
      slotMap.get(key).sessionIds.push(session.id);
    }
    return {
      day,
      date: ['2026-09-02', '2026-09-03', '2026-09-04'][day],
      label: ['Day 0', 'Day 1', 'Day 2'][day],
      slots: [...slotMap.values()],
    };
  });

  fs.mkdirSync(OUT, { recursive: true });
  const writes = {
    'speakers.json': speakers,
    'sessions.json': sessions,
    'schedule.json': { timezone: 'America/Chicago', days },
    'events.json': socialEvents,
    'tracks.json': { tracks: TRACKS, rooms: ROOMS },
  };
  for (const [name, payload] of Object.entries(writes)) {
    const file = path.join(OUT, name);
    fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Wrote ${file}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
