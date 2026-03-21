const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Config plugin that resolves the full chain of iOS build issues for this stack:
 * React Native Firebase v23 + react-native-reanimated v4 + react-native-worklets
 * + @react-native-google-signin + New Architecture + use_frameworks! :linkage => :static
 *
 * ── Step 1: use_frameworks! :linkage => :static ──────────────────────────────
 * Writes `ios.useFrameworks = "static"` to Podfile.properties.json. The
 * Expo-generated Podfile (RN 0.73+) reads this and applies:
 *   use_frameworks! :linkage => podfile_properties['ios.useFrameworks'].to_sym
 * Fixes: Firebase Swift pod module errors at pod install stage.
 * Also fixes: gRPC-C++ module map path error that `use_modular_headers!` causes.
 *
 * ── Step 2: Post-install build settings injected into existing block ──────────
 * Locates `post_install do |installer|` in the Podfile, then finds the matching
 * closing `end` by detecting the indentation of that line and searching for the
 * first `end` at exactly that same indentation level. This is necessary because:
 *
 *   - The Expo-generated Podfile nests `post_install` INSIDE `target 'App' do`,
 *     so the post_install closer is `\n  end` (with 2-space indent), NOT `\nend`.
 *   - A plain `indexOf('\nend')` only matches `end` at column 0, so it skips the
 *     post_install closer entirely and finds the outer target-block `end` instead.
 *   - The injection therefore landed outside the post_install scope, where the
 *     `installer` block parameter is undefined — causing the CocoaPods parse error.
 *
 * The indentation-aware regex `/\n<same-indent>end(?!\w)/` correctly identifies
 * the post_install closing `end` regardless of how deeply the block is nested.
 *
 *   A. CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES = YES
 *      Belt-and-suspenders for Xcode ≤ 16.2. Deprecated and ignored in
 *      Xcode 16.3+ / Clang 26 (iPhoneOS 26.0 SDK) — covered by section D.
 *
 *   D. DEFINES_MODULE = NO  (RNFB* and RNGoogleSignin pods only)
 *      Fixes: @react-native-firebase (RNFBFirestore, RNFBAnalytics, …) and
 *      @react-native-google-signin Objective-C bridge files include React-Core
 *      headers (RCTBridgeModule.h, RCTConvert.h, …) with `#import <React/…>`.
 *      With use_frameworks! each pod is compiled as a framework module, and
 *      in Xcode 16.3+ / Clang 26 the compiler hard-errors on non-modular includes
 *      inside a framework module even when CLANG_ALLOW_NON_MODULAR_INCLUDES…=YES.
 *      Setting DEFINES_MODULE=NO removes those pods from the framework-module
 *      system (no module map is generated), so their ObjC files are free to
 *      include React headers the traditional way without any restriction.
 *      Confirmed root cause: RNFBFirestoreTransactionModule.m / RNFBFirestoreCommon.h
 *      failing to resolve RCTPromiseRejectBlock on iPhoneOS26.0.sdk (EAS build).
 *
 *   B. SWIFT_COMPILATION_MODE = wholemodule (Release only)
 *      Fixes: react-native-reanimated v4 and react-native-worklets use Swift for
 *      their worklet runtime. With New Architecture enabled and use_frameworks!
 *      :linkage => :static, the Swift compiler can emit "cannot access type from
 *      within the same module" errors in Release mode unless whole-module
 *      optimisation is on. (Documented in the Reanimated v4 static-frameworks guide.)
 *
 *   C. IPHONEOS_DEPLOYMENT_TARGET normalisation
 *      Fixes: transitive pods (GoogleUtilities, DoubleConversion, etc.) sometimes
 *      declare a minimum iOS target lower than the project's 15.1. Xcode promotes
 *      these mismatches to warnings which become hard errors during archive.
 */

const PODFILE_INJECTION = `
  # ── EAS build hardening injected by plugins/withModularHeaders.js ──────────
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|

      # A. Belt-and-suspenders for Xcode <= 16.2 (deprecated/ignored in 16.3+).
      config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'

      # D. For React Native Firebase and Google Sign-In bridge pods: disable
      #    module map generation so their Objective-C files can freely include
      #    React Native headers (RCTBridgeModule.h etc.) without the hard
      #    "non-modular include within framework module" error in Xcode 16.3+
      #    / Clang 26 where CLANG_ALLOW_NON_MODULAR_INCLUDES is deprecated.
      if target.name.start_with?('RNFB') || target.name == 'RNGoogleSignin'
        config.build_settings['DEFINES_MODULE'] = 'NO'
      end

      # B. react-native-reanimated v4 + react-native-worklets require whole-module
      #    Swift compilation in Release to avoid type-access errors with New Architecture.
      if config.name == 'Release'
        config.build_settings['SWIFT_COMPILATION_MODE'] = 'wholemodule'
      end

      # C. Normalize deployment target — prevents warnings-as-errors for transitive
      #    pods that declare a minimum iOS target below the project minimum (15.1).
      deployment_target = config.build_settings['IPHONEOS_DEPLOYMENT_TARGET']
      if deployment_target && deployment_target.to_f < 15.1
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
      end
    end
  end
  # ── end EAS build hardening ─────────────────────────────────────────────────
`;

module.exports = function withModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      // ── Step 1: use_frameworks! :linkage => :static ─────────────────────────
      const propertiesPath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile.properties.json'
      );

      let properties = {};
      if (fs.existsSync(propertiesPath)) {
        try {
          properties = JSON.parse(fs.readFileSync(propertiesPath, 'utf-8'));
        } catch (_) {
          // Start fresh if file is corrupt
        }
      }

      properties['ios.useFrameworks'] = 'static';
      fs.writeFileSync(propertiesPath, JSON.stringify(properties, null, 2));

      // ── Step 2: Inject build settings into the existing post_install block ──
      // We locate `post_install do |installer|` in the Podfile, detect its
      // leading indentation, then search for the first `end` at exactly that
      // same indentation level — the closing delimiter of the block.
      //
      // Why indentation-aware?  The Expo Podfile nests post_install inside the
      // target block, so the closer is `\n  end` (2-space indent).  A plain
      // indexOf('\nend') only matches `end` at column 0, skipping the post_install
      // closer and landing on the outer target-block `end` instead — outside the
      // post_install scope where `installer` is undefined.
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile'
      );

      let podfileContents = fs.readFileSync(podfilePath, 'utf-8');

      if (!podfileContents.includes('CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES')) {
        // Locate `post_install do |installer|` — the block that defines the
        // `installer` variable we reference in PODFILE_INJECTION.
        const postInstallStart = podfileContents.indexOf('post_install do |installer|');

        if (postInstallStart !== -1) {
          // Detect the indentation of the `post_install do |installer|` line so
          // we can match ITS closing `end` at the same indent level, not a nested
          // inner `end` or the outer target-block `end` at column 0.
          const lineStart = podfileContents.lastIndexOf('\n', postInstallStart - 1) + 1;
          const postInstallIndent = (
            podfileContents.slice(lineStart, postInstallStart).match(/^[ \t]*/) ?? ['']
          )[0];
          // Escape special regex chars in the indent string (handles tabs if present).
          const escapedIndent = postInstallIndent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Build a pattern that matches `\n<same-indent>end` NOT followed by a
          // word char — e.g. /\n  end(?!\w)/ for a 2-space-indented post_install.
          const closingEndPattern = new RegExp('\n' + escapedIndent + 'end(?!\\w)');
          const closingEndMatch = closingEndPattern.exec(
            podfileContents.slice(postInstallStart),
          );
          if (closingEndMatch !== null) {
            const closingEndIndex = postInstallStart + closingEndMatch.index;
            podfileContents =
              podfileContents.slice(0, closingEndIndex) +
              PODFILE_INJECTION +
              podfileContents.slice(closingEndIndex);
            fs.writeFileSync(podfilePath, podfileContents);
          }
        } else {
          // Fallback: no post_install block found (non-standard Podfile).
          // Wrap the injection in a new post_install block and insert it before
          // the last `end` in the file (the target block closer).
          const lastEndIndex = podfileContents.lastIndexOf('\nend');
          if (lastEndIndex !== -1) {
            const wrappedInjection =
              '\n  post_install do |installer|' +
              PODFILE_INJECTION +
              '\n  end\n';
            podfileContents =
              podfileContents.slice(0, lastEndIndex) +
              wrappedInjection +
              podfileContents.slice(lastEndIndex);
            fs.writeFileSync(podfilePath, podfileContents);
          }
        }
      }

      return config;
    },
  ]);
};
