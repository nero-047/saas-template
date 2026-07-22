import { readFile } from 'node:fs/promises';

const checks = [
  ['app.json', ['"name": "Rn"']],
  ['ios/Podfile', ["target 'Rn' do", 'use_react_native!']],
  ['ios/Rn/AppDelegate.swift', ['class AppDelegate', 'withModuleName: "Rn"']],
  ['ios/Rn/Info.plist', ['CFBundleIdentifier', '$(PRODUCT_BUNDLE_IDENTIFIER)']],
  [
    'ios/Rn.xcodeproj/project.pbxproj',
    ['AppDelegate.swift in Sources', 'INFOPLIST_FILE = Rn/Info.plist'],
  ],
  [
    'ios/Rn.xcodeproj/xcshareddata/xcschemes/Rn.xcscheme',
    ['BuildableName = "Rn.app"', 'BlueprintName = "Rn"'],
  ],
];

for (const [path, expectedValues] of checks) {
  const contents = await readFile(path, 'utf8');

  for (const expected of expectedValues) {
    if (!contents.includes(expected)) {
      throw new Error(`${path} is missing required iOS configuration.`);
    }
  }
}

const scheme = await readFile(
  'ios/Rn.xcodeproj/xcshareddata/xcschemes/Rn.xcscheme',
  'utf8',
);

if (scheme.includes('RnTests')) {
  throw new Error('The shared scheme references an untracked native test target.');
}

console.log('iOS project configuration is internally consistent.');
