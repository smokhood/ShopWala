#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Applying patches for Gradle 8 compatibility...');

const modulePath = path.join(__dirname, '..', 'node_modules', 'expo-firebase-core', 'android');

if (fs.existsSync(modulePath)) {
  // Patch 1: Fix build.gradle for Gradle 8
  const buildGradlePath = path.join(modulePath, 'build.gradle');
  let buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');

  buildGradleContent = buildGradleContent
    .replace("classifier = 'sources'", "archiveClassifier.set('sources')")
    .replace('compileSdkVersion safeExtGet("compileSdkVersion", 31)', 'compileSdk safeExtGet("compileSdkVersion", 31)');

  fs.writeFileSync(buildGradlePath, buildGradleContent);
  console.log('✅ Patched build.gradle');

  // Patch 2: Fix FirebaseCoreModule.java for expo-modules-core v3
  const moduleJavaPath = path.join(modulePath, 'src', 'main', 'java', 'expo', 'modules', 'firebase', 'core', 'FirebaseCoreModule.java');
  const moduleJavaContent = `// Copyright 2020-present 650 Industries. All rights reserved.

package expo.modules.firebase.core;

import android.content.Context;

import androidx.annotation.Nullable;

import java.util.Map;
import java.util.HashMap;

import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;

import expo.modules.core.interfaces.Package;

public class FirebaseCoreModule {
  private static final String NAME = "ExpoFirebaseCore";
  private static final String DEFAULT_APP_NAME = "[DEFAULT]";

  public static String getName() {
    return NAME;
  }

  public static Map<String, Object> getConstants(Context context) {
    final Map<String, Object> constants = new HashMap<>();
    constants.put("DEFAULT_APP_NAME", DEFAULT_APP_NAME);
    
    try {
      FirebaseApp defaultApp = FirebaseApp.getInstance();
      if (defaultApp != null) {
        constants.put("DEFAULT_APP_NAME", defaultApp.getName());
        FirebaseOptions options = defaultApp.getOptions();
        Map<String, String> optionsMap = FirebaseCoreOptions.toJSON(options);
        if (optionsMap != null) {
          constants.put("DEFAULT_APP_OPTIONS", optionsMap);
        }
      }
    } catch (Exception e) {
      // Firebase not initialized yet
    }
    
    return constants;
  }
}
`;

  fs.writeFileSync(moduleJavaPath, moduleJavaContent);
  console.log('✅ Patched FirebaseCoreModule.java');

  // Patch 3: Fix FirebaseCorePackage.java
  const packageJavaPath = path.join(modulePath, 'src', 'main', 'java', 'expo', 'modules', 'firebase', 'core', 'FirebaseCorePackage.java');
  const packageJavaContent = `package expo.modules.firebase.core;

import android.content.Context;

import java.util.Collections;
import java.util.List;

import expo.modules.core.BasePackage;
import expo.modules.core.interfaces.InternalModule;

public class FirebaseCorePackage extends BasePackage {
  @Override
  public List<InternalModule> createInternalModules(Context context) {
    return Collections.singletonList((InternalModule) new FirebaseCoreService(context));
  }
}
`;

  fs.writeFileSync(packageJavaPath, packageJavaContent);
  console.log('✅ Patched FirebaseCorePackage.java');
} else {
  console.log('ℹ️ expo-firebase-core not installed, skipping firebase core patch');
}

// Patch 4: Fix react-native-screens spotless.gradle issue
const screensBuildGradlePath = path.join(__dirname, '..', 'node_modules', 'react-native-screens', 'android', 'build.gradle');
if (fs.existsSync(screensBuildGradlePath)) {
  let screensBuildGradleContent = fs.readFileSync(screensBuildGradlePath, 'utf8');
  
  // Comment out the spotless.gradle apply line
  screensBuildGradleContent = screensBuildGradleContent.replace(
    /if \(isRunningInContextOfScreensRepo\(\)\) \{\s*apply from: 'spotless\.gradle'\s*\}/gs,
    '// Spotless disabled for Expo builds\n// if (isRunningInContextOfScreensRepo()) {\n//     apply from: \'spotless.gradle\'\n// }'
  );
  
  fs.writeFileSync(screensBuildGradlePath, screensBuildGradleContent);
  console.log('✅ Patched react-native-screens build.gradle');
}

console.log('✅ All patches applied successfully!');
