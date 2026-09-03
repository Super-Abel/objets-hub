// Populates the API with a few sample objects so a fresh checkout has content.
// Usage: pnpm seed [count]        (API must be running; default http://localhost:4000)
//   API_URL=http://host:port pnpm seed 12

const API_URL = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
const count = Math.max(1, parseInt(process.argv[2] ?? '6', 10));

// 1x1 PNGs in a few colors so the seeded images aren't all identical.
const PNG_BY_COLOR = {
  red: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  green: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNk+M9QDwAEhQGAV4z5+wAAAABJRU5ErkJggg==',
  blue: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADElEQVR42mNgYPhfDwAChwGAw0mFbwAAAABJRU5ErkJggg==',
};
const colors = Object.keys(PNG_BY_COLOR);

const SAMPLES = [
  ['Vintage rangefinder', 'A 1970s 35mm camera with a fast prime lens.'],
  ['Mechanical keyboard', 'Tenkeyless board, tactile switches, PBT keycaps.'],
  ['Ceramic mug', 'Hand-thrown stoneware, matte glaze, holds 350ml.'],
  ['Desk lamp', 'Articulated arm, warm dimmable LED, brushed aluminium.'],
  ['Field notebook', 'A6, dot grid, lay-flat binding, 90gsm paper.'],
  ['Carabiner', 'Anodised aluminium, 24kN gate, keyring size.'],
  ['Espresso tamper', '58mm stainless base, walnut handle.'],
  ['Pocket knife', 'Slip-joint, drop point blade, micarta scales.'],
];

async function seedOne(i) {
  const [title, description] = SAMPLES[i % SAMPLES.length];
  const color = colors[i % colors.length];
  const bytes = Buffer.from(PNG_BY_COLOR[color], 'base64');

  const form = new FormData();
  form.append('title', `${title} #${i + 1}`);
  form.append('description', description);
  form.append('image', new Blob([bytes], { type: 'image/png' }), `${color}.png`);

  const res = await fetch(`${API_URL}/objects`, { method: 'POST', body: form });
  if (!res.ok) {
    throw new Error(`POST /objects failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

try {
  await fetch(`${API_URL}/health`).catch(() => {
    throw new Error(`API not reachable at ${API_URL} — start it first.`);
  });
  for (let i = 0; i < count; i++) {
    const obj = await seedOne(i);
    console.log(`created ${obj.id}  ${obj.title}`);
  }
  console.log(`\nSeeded ${count} object(s) into ${API_URL}.`);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
