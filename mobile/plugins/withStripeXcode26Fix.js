/**
 * Expo config plugin: fix Stripe iOS archive on Xcode 26+.
 *
 * @stripe/stripe-react-native@0.50.3 (Expo SDK 54) forward-declares
 * STPPaymentStatus as NSUInteger, but StripePayments defines it as NSInteger.
 * Xcode 26 treats that mismatch as a hard error:
 *   enumeration redeclared with different underlying type 'NSInteger' (was 'NSUInteger')
 *
 * Official fix shipped in 0.61.0, which is not the Expo 54-compatible version.
 * Patch the header during prebuild so EAS / pod install pick it up.
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const MARKER = 'withStripeXcode26Fix';
const OLD_DECL = 'typedef NS_ENUM(NSUInteger, STPPaymentStatus);';
const NEW_DECL = 'typedef NS_ENUM(NSInteger, STPPaymentStatus);';

const POST_INSTALL_SNIPPET = `
  # @generated ${MARKER}: STPPaymentStatus NSInteger for Xcode 26+
  stripe_interop = File.expand_path('../node_modules/@stripe/stripe-react-native/ios/StripeSwiftInterop.h', __dir__)
  if File.exist?(stripe_interop)
    contents = File.read(stripe_interop)
    patched = contents.gsub(
      '${OLD_DECL}',
      '${NEW_DECL}'
    )
    if patched != contents
      File.write(stripe_interop, patched)
      Pod::UI.puts '[${MARKER}] Patched StripeSwiftInterop.h for Xcode 26'
    end
  end
`;

function patchStripeInteropHeader(projectRoot) {
  const headerPath = path.join(
    projectRoot,
    'node_modules/@stripe/stripe-react-native/ios/StripeSwiftInterop.h',
  );
  if (!fs.existsSync(headerPath)) return;

  const contents = fs.readFileSync(headerPath, 'utf8');
  if (!contents.includes(OLD_DECL)) return;

  fs.writeFileSync(headerPath, contents.replace(OLD_DECL, NEW_DECL));
}

module.exports = function withStripeXcode26Fix(config) {
  return withDangerousMod(config, [
    'ios',
    async (cfg) => {
      patchStripeInteropHeader(cfg.modRequest.projectRoot);

      const podfile = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
      let contents = fs.readFileSync(podfile, 'utf8');

      if (contents.includes(MARKER)) return cfg;

      contents = contents.replace(
        /post_install do \|installer\|/,
        (match) => `${match}\n${POST_INSTALL_SNIPPET}`,
      );

      fs.writeFileSync(podfile, contents);
      return cfg;
    },
  ]);
};
