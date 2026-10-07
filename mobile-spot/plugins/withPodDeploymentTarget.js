/**
 * Expo config plugin: raise every pod to iOS 15.1 (required by Xcode 27).
 *
 * Xcode 27 only accepts iOS 15.0+ deployment targets, but several pods and
 * their resource-bundle targets (Stripe, GoogleSignIn, RNSVG, SDWebImage,
 * react-native-maps, Firebase privacy bundles, ...) still declare 9.0-13.4,
 * which fails the build. A Podfile post_install hook bumps anything lower to
 * 15.1 (React Native 0.81's minimum). It runs after react_native_post_install
 * so nothing resets it.
 *
 * Injected into the generated Podfile so it survives `expo prebuild --clean`.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'withPodDeploymentTarget';
const MIN_IOS = '15.1';

const SNIPPET = `
    # @generated ${MARKER}: Xcode 27 only accepts iOS 15+ pod targets
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        if config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < ${MIN_IOS}
          config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${MIN_IOS}'
        end
      end
    end
`;

module.exports = function withPodDeploymentTarget(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (contents.includes(MARKER)) return cfg; // idempotent

      // Right after the react_native_post_install(...) call inside post_install.
      const afterRnPostInstall = /(react_native_post_install\([\s\S]*?\n\s*\)\n)/;
      if (!afterRnPostInstall.test(contents)) {
        throw new Error(`[${MARKER}] react_native_post_install(...) not found in Podfile`);
      }
      contents = contents.replace(afterRnPostInstall, (match) => `${match}${SNIPPET}`);

      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
