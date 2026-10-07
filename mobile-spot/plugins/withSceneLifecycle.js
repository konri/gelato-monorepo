/**
 * Expo config plugin: adopt the UIScene lifecycle (required by the iOS 27 SDK).
 *
 * Apps built with Xcode 27 that still use the app-delegate window lifecycle are
 * terminated at launch on iOS 27 (_UIApplicationEvaluateRuntimeIssueFor-
 * NoSceneLifecycleAdoption). Expo SDK 54's AppDelegate template has no scene
 * delegate, so this plugin:
 *   - declares a single-window UIApplicationSceneManifest in Info.plist;
 *   - appends a SceneDelegate to AppDelegate.swift.
 *
 * The template still creates the window and starts React Native in
 * didFinishLaunching, because Expo subscribers (expo-dev-launcher) need the
 * window during launch. SceneDelegate moves that window onto the scene, and
 * forwards URLs, universal links and life-cycle events to AppDelegate (UIKit
 * stops calling them on the app delegate once scenes are adopted), so Expo
 * modules, React Native linking and Google Sign-In keep working.
 *
 * Applied on every `expo prebuild`, so it survives `--clean`.
 */
const { withAppDelegate, withInfoPlist } = require('@expo/config-plugins');

const MARKER = 'withSceneLifecycle';

const SCENE_DELEGATE = `
// @generated ${MARKER}: UIScene lifecycle (required by the iOS 27 SDK)
// Owns the window under the UIScene lifecycle. With scenes, UIKit no longer
// calls the app delegate's URL and life-cycle methods, so they are forwarded to
// AppDelegate, which passes them on to Expo modules and React Native linking.
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  private var appDelegate: AppDelegate? { UIApplication.shared.delegate as? AppDelegate }

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene, let appDelegate = appDelegate else { return }

    // Move the window React Native was started in onto this scene.
    let window = appDelegate.window ?? UIWindow(windowScene: windowScene)
    window.windowScene = windowScene
    window.makeKeyAndVisible()
    self.window = window
    appDelegate.window = window

    // Cold start from a link or a universal link.
    if let context = connectionOptions.urlContexts.first {
      open(context)
    }
    if let activity = connectionOptions.userActivities.first {
      _ = appDelegate.application(UIApplication.shared, continue: activity, restorationHandler: { _ in })
    }
  }

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    URLContexts.forEach(open)
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = appDelegate?.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }

  func sceneDidBecomeActive(_ scene: UIScene) {
    appDelegate?.applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    appDelegate?.applicationWillResignActive(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    appDelegate?.applicationWillEnterForeground(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    appDelegate?.applicationDidEnterBackground(UIApplication.shared)
  }

  private func open(_ context: UIOpenURLContext) {
    var options: [UIApplication.OpenURLOptionsKey: Any] = [:]
    if let source = context.options.sourceApplication { options[.sourceApplication] = source }
    if let annotation = context.options.annotation { options[.annotation] = annotation }
    _ = appDelegate?.application(UIApplication.shared, open: context.url, options: options)
  }
}
`;

const SCENE_MANIFEST = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: 'Default Configuration',
        UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
      },
    ],
  },
};

function withSceneDelegate(config) {
  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error(`[${MARKER}] expected a Swift AppDelegate, got ${cfg.modResults.language}`);
    }
    if (!cfg.modResults.contents.includes(MARKER)) {
      cfg.modResults.contents = `${cfg.modResults.contents.trimEnd()}\n${SCENE_DELEGATE}`;
    }
    return cfg;
  });
}

function withSceneManifest(config) {
  return withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = SCENE_MANIFEST;
    return cfg;
  });
}

module.exports = function withSceneLifecycle(config) {
  return withSceneManifest(withSceneDelegate(config));
};
