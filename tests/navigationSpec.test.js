const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('app exposes exactly Translator, Dictionary and Voice routes', () => {
  const app = read('App.js');
  const names = [...app.matchAll(/name="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(names.sort(), ['Dicionário','Tradutor','Voz'].sort());
});

test('app has no camera or image translation route', () => {
  const app = read('App.js').toLowerCase();
  assert.equal(app.includes('camera'), false);
  assert.equal(app.includes('image'), false);
  assert.equal(app.includes('imagem'), false);
});

test('theme is pastel orange and screens use vector icons rather than emoji glyphs', () => {
  const theme = read('src/theme.js');
  assert.match(theme, /#F39A68/i);
  const screens = [
    read('src/screens/TranslatorScreen.js'),
    read('src/screens/DictionaryScreen.js'),
    read('src/screens/VoiceScreen.js'),
  ].join('\n');
  assert.match(screens, /MaterialCommunityIcons/);
  assert.equal(/[🌍🎤📚🔄📋📷🖼️]/u.test(screens), false);
});

test('logo component contains a vector globe icon with white foreground', () => {
  const logo = read('src/components/NeoLogo.js');
  assert.match(logo, /web/i);
  assert.match(logo, /white|#fff/i);
});


test('voice screen requests Android microphone permission at runtime', () => {
  const voice = read('src/screens/VoiceScreen.js');
  const manifest = read('android/app/src/main/AndroidManifest.xml');
  assert.match(voice, /PermissionsAndroid/);
  assert.match(voice, /RECORD_AUDIO/);
  assert.match(voice, /PermissionsAndroid\.request/);
  assert.match(manifest, /android\.permission\.RECORD_AUDIO/);
});

test('screens use safe-area-context and fast 80ms motion', () => {
  const translator = read('src/screens/TranslatorScreen.js');
  const dictionary = read('src/screens/DictionaryScreen.js');
  const voice = read('src/screens/VoiceScreen.js');
  const card = read('src/components/SurfaceCard.js');
  for (const src of [translator,dictionary,voice]) assert.match(src, /react-native-safe-area-context/);
  assert.match(card, /duration:\s*80/);
});

test('android launcher includes an adaptive Neo icon', () => {
  const fg = read('android/app/src/main/res/drawable/ic_launcher_foreground.xml');
  const adaptive = read('android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml');
  assert.match(fg, /#FFFFFFFF/i);
  assert.match(adaptive, /ic_launcher_foreground/);
});
