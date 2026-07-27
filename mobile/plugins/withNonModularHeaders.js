/**
 * Expo config plugin: make @react-native-firebase build under static frameworks.
 *
 * Under `use_frameworks! :linkage => :static` (required by the Firebase iOS SDK)
 * RNFBApp's Obj-C headers #include React-Core headers non-modularly, which clang
 * rejects with -Werror=non-modular-include-in-framework-module. Setting
 * CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES on every target in
 * a Podfile post_install hook is the fix. This mirrors the proven worker-mobile
 * setup (Expo SDK 54 / RN 0.81 / RNFirebase 25.1.0) — CLANG flag only, no
 * use_modular_headers! and no buildReactNativeFromSource.
 *
 * Injected into the generated Podfile so it survives `expo prebuild --clean`.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'withNonModularHeaders';

const POST_INSTALL_SNIPPET = `
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

      // Allow non-modular includes in the post_install block. (Matches the
      // proven worker-mobile recipe: CLANG flag only, NO use_modular_headers!.)
      contents = contents.replace(
        /post_install do \|installer\|/,
        (match) => `${match}\n${POST_INSTALL_SNIPPET}`,
      );

      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
