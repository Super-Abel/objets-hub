import { generateImageStorageKey } from './generate-storage-key';

describe('generateImageStorageKey', () => {
  it('keeps only the extension of the original name, never a path segment', () => {
    const key = generateImageStorageKey('../../etc/passwd.png');
    expect(key).toMatch(/^objects\/[0-9a-f]{32}\.png$/);
  });

  it('lowercases the extension', () => {
    expect(generateImageStorageKey('PHOTO.JPG')).toMatch(/\.jpg$/);
  });

  it('produces a different key on every call', () => {
    const a = generateImageStorageKey('a.png');
    const b = generateImageStorageKey('a.png');
    expect(a).not.toBe(b);
  });

  it('omits the extension when the name has none', () => {
    expect(generateImageStorageKey('camera')).toMatch(/^objects\/[0-9a-f]{32}$/);
  });

  it('honours a custom prefix and normalises its slashes', () => {
    expect(generateImageStorageKey('a.webp', '\\uploads\\images\\')).toMatch(
      /^uploads\/images\/[0-9a-f]{32}\.webp$/,
    );
  });

  it('drops the prefix entirely when it is empty', () => {
    expect(generateImageStorageKey('a.gif', '   ')).toMatch(
      /^[0-9a-f]{32}\.gif$/,
    );
  });
});
