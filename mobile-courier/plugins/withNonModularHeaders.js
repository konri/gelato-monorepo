/**
 * Expo config plugin: allow non-modular includes in framework modules.
 *
 * @react-native-firebase's iOS headers (RNFBApp/*) `#include` React-Core headers
 * non-modularly. Under `useFrameworks: "static"` (required by RNFirebase) Clang
 * treats that as an error (-Werror,-Wnon-modular-include-in-framework-module),
 * failing the build. Setting CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES
 * = YES on every pod target is the standard remedy. Injected via a Podfile
 * post_install hook so it survives `expo prebuild --clean`.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'withNonModularHeaders';

const SNIPPET = `
  # @generated ${MARKER}: allow non-modular includes (RNFirebase + static frameworks)
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
    end
  end
`;

module.exports = function withNonModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (contents.includes(MARKER)) return cfg; // idempotent

      // Insert our snippet at the very start of the existing `post_install do |installer|` block.
      contents = contents.replace(
        /post_install do \|installer\|/,
        (match) => `${match}\n${SNIPPET}`,
      );

      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
