#!/usr/bin/env node
/**
 * Android Build Script for KhodroYar
 * Automates the build process for Android APK
 */

import { execSync, exec } from 'child_process';
import fs from 'fs';
import path from 'path';

// Simple color helpers
const log = {
  info: (msg: string) => console.log('[INFO] ' + msg),
  success: (msg: string) => console.log('[SUCCESS] ' + msg),
  error: (msg: string) => console.log('[ERROR] ' + msg),
  warning: (msg: string) => console.log('[WARNING] ' + msg),
  title: (msg: string) => console.log('\n=== ' + msg + ' ===\n'),
};

// Check if command exists
function commandExists(cmd: string): boolean {
  try {
    execSync(`command -v ${cmd} 2>/dev/null || which ${cmd} 2>/dev/null`);
    return true;
  } catch {
    return false;
  }
}

// Check prerequisites
function checkPrerequisites(): { missing: string[]; warnings: string[] } {
  const missing: string[] = [];
  const warnings: string[] = [];

  // Check Node.js
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    const version = parseInt(nodeVersion.replace('v', '').split('.')[0]);
    if (version < 18) {
      missing.push(`Node.js 18+ (current: ${nodeVersion})`);
    }
  } catch {
    missing.push('Node.js');
  }

  // Check npm
  if (!commandExists('npm')) {
    missing.push('npm');
  }

  // Check Expo CLI
  if (!commandExists('expo')) {
    warnings.push('Expo CLI not found. Install with: npm install -g expo-cli');
  }

  // Check EAS CLI
  if (!commandExists('eas')) {
    warnings.push('EAS CLI not found. Install with: npm install -g eas-cli');
  }

  // Check Java (for Android builds)
  if (process.platform !== 'win32' && !commandExists('java')) {
    warnings.push('Java JDK not found. Required for Android builds.');
  }

  // Check Android SDK (for local builds)
  if (process.env.ANDROID_HOME && !fs.existsSync(process.env.ANDROID_HOME)) {
    warnings.push(`ANDROID_HOME (${process.env.ANDROID_HOME}) does not exist`);
  }

  return { missing, warnings };
}

// Run command with promise
function runCommand(cmd: string, cwd?: string): Promise<{ success: boolean; output: string; error?: string }> {
  return new Promise((resolve) => {
    log.info(`Running: ${cmd}`);
    
    exec(cmd, { cwd, stdio: 'pipe', maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          output: stdout,
          error: stderr || error?.message || 'Unknown error',
        });
      } else {
        resolve({
          success: true,
          output: stdout,
        });
      }
    });
  });
}

// Main build functions
async function runEasBuild(profile: string = 'preview') {
  log.title('Building Android APK with EAS');
  
  // Step 1: Install dependencies
  log.info('Installing dependencies...');
  const installResult = await runCommand('npm install');
  if (!installResult.success) {
    log.error('Failed to install dependencies');
    console.log(installResult.error);
    process.exit(1);
  }
  log.success('Dependencies installed');

  // Step 2: Doctor check
  log.info('Running expo doctor...');
  const doctorResult = await runCommand('npx expo-doctor');
  if (!doctorResult.success) {
    log.warning('Expo doctor found issues');
    console.log(doctorResult.error);
  }

  // Step 3: EAS build
  log.info(`Starting EAS build with profile: ${profile}`);
  log.info('This may take several minutes...');
  
  const buildResult = await runCommand(
    `npx eas-cli build --platform android --profile ${profile}`
  );

  if (buildResult.success) {
    log.success('Build completed successfully!');
    console.log(buildResult.output);
    
    // Extract artifact URL if available
    const match = buildResult.output.match(/https:\/\/expo\.dev\/artifacts\/[^\s]+/);
    if (match) {
      log.info(`\nArtifact URL: ${match[0]}`);
    }
    
    return { success: true };
  } else {
    log.error('Build failed');
    console.log(buildResult.error);
    return { success: false, error: buildResult.error };
  }
}

async function runLocalBuild() {
  log.title('Building Android APK Locally');
  
  const projectDir = process.cwd();
  const androidDir = path.join(projectDir, 'android');

  // Step 1: Prebuild
  log.info('Running expo prebuild...');
  const prebuildResult = await runCommand('npx expo prebuild', projectDir);
  if (!prebuildResult.success) {
    log.error('Prebuild failed');
    console.log(prebuildResult.error);
    process.exit(1);
  }
  log.success('Prebuild completed');

  // Step 2: Gradle build
  log.info('Running Gradle build...');
  log.info('This may take several minutes...');
  
  const gradleCmd = process.platform === 'win32' 
    ? 'gradlew.bat assembleRelease' 
    : './gradlew assembleRelease';
  
  const buildResult = await runCommand(gradleCmd, androidDir);
  
  if (buildResult.success) {
    log.success('Gradle build completed');
    
    // Find APK path
    const apkPath = path.join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
    
    if (fs.existsSync(apkPath)) {
      const stats = fs.statSync(apkPath);
      const size = (stats.size / (1024 * 1024)).toFixed(2);
      
      log.success(`APK created successfully!`);
      log.info(`Path: ${apkPath}`);
      log.info(`Size: ${size} MB`);
      
      // Calculate SHA-256
      try {
        const hash = execSync(`sha256sum "${apkPath}" 2>/dev/null || certUtil -hashfile SHA256 "${apkPath}" 2>/dev/null || echo "Hash unavailable"`).toString().trim();
        if (hash && !hash.includes('Hash unavailable')) {
          log.info(`SHA-256: ${hash.split(' ')[0] || hash}`);
        }
      } catch {
        // SHA-256 calculation not available on this platform
      }
      
      return { success: true, apkPath };
    } else {
      log.warning('APK file not found at expected path');
      return { success: false, error: 'APK not found' };
    }
  } else {
    log.error('Gradle build failed');
    console.log(buildResult.error);
    return { success: false, error: buildResult.error };
  }
}

async function installApk(apkPath: string) {
  log.title('Installing APK on Device');
  
  // Check if adb is available
  if (!commandExists('adb')) {
    log.error('adb not found. Android SDK platform-tools not installed.');
    return { success: false, error: 'adb not found' };
  }

  // Check for devices
  log.info('Checking for connected devices...');
  const devicesResult = await runCommand('adb devices');
  
  if (devicesResult.output.includes('List of devices attached')) {
    const lines = devicesResult.output.split('\n');
    const deviceLines = lines.filter(line => line.includes('\t') && !line.includes('List'));
    
    if (deviceLines.length === 0) {
      log.error('No devices connected. Please connect an Android device or start an emulator.');
      return { success: false, error: 'no devices' };
    }
    
    log.info(`Found ${deviceLines.length} device(s)`);
    deviceLines.forEach(line => log.info(`  - ${line.trim()}`));
    
    // Install APK
    log.info(`Installing APK: ${apkPath}`);
    const installResult = await runCommand(`adb install -r "${apkPath}"`);
    
    if (installResult.success) {
      log.success('APK installed successfully!');
      return { success: true };
    } else {
      log.error('Failed to install APK');
      console.log(installResult.error);
      return { success: false, error: installResult.error };
    }
  } else {
    log.error('Failed to list devices');
    return { success: false, error: devicesResult.error };
  }
}

// Main CLI
async function main() {
  log.title('KhodroYar Android Build Script');
  
  // Check prerequisites
  const { missing, warnings } = checkPrerequisites();
  
  if (missing.length > 0) {
    log.error('Missing prerequisites:');
    missing.forEach(item => log.error(`  - ${item}`));
    process.exit(1);
  }
  
  warnings.forEach(warning => log.warning(warning));
  
  // Parse arguments
  const args = process.argv.slice(2);
  const method = args[0] as 'eas' | 'local' | 'install';
  const profile = args[1] as 'development' | 'preview' | 'production';
  const apkPath = args[2];
  
  try {
    switch (method) {
      case 'eas':
        await runEasBuild(profile || 'preview');
        break;
      
      case 'local':
        const result = await runLocalBuild();
        if (result.success && result.apkPath) {
          // Auto-install if --install flag
          if (args.includes('--install')) {
            await installApk(result.apkPath);
          }
        }
        break;
      
      case 'install':
        if (apkPath) {
          await installApk(apkPath);
        } else {
          log.error('Please provide APK path');
          console.log('Usage: node scripts/build-android.ts install /path/to/app.apk');
        }
        break;
      
      default:
        log.info('KhodroYar Android Build Script');
        log.info('');
        log.info('Usage:');
        console.log(`
  npm run build:android:eas [profile]     Build with EAS (default: preview)
  npm run build:android:local            Build locally
  npm run build:android:install [apk]   Install APK on device

  Examples:
    npm run build:android:eas
    npm run build:android:eas preview
    npm run build:android:eas production
    npm run build:android:local
    npm run build:android:local --install
    npm run build:android:install ./android/app/build/outputs/apk/release/app-release.apk

  EAS Profiles:
    development - Development APK with dev client
    preview     - Preview APK (default)
    production  - Production AAB for Play Store
`);
        break;
    }
  } catch (error: any) {
    log.error('Build failed with error');
    console.error(error);
    process.exit(1);
  }
}

// Add npm scripts to package.json
function updatePackageJson() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!pkg.scripts) {
      pkg.scripts = {};
    }
    
    // Add build scripts
    pkg.scripts['build:android:eas'] = 'tsx scripts/build-android.ts eas';
    pkg.scripts['build:android:preview'] = 'tsx scripts/build-android.ts eas preview';
    pkg.scripts['build:android:development'] = 'tsx scripts/build-android.ts eas development';
    pkg.scripts['build:android:production'] = 'tsx scripts/build-android.ts eas production';
    pkg.scripts['build:android:local'] = 'tsx scripts/build-android.ts local';
    pkg.scripts['build:android:install'] = 'tsx scripts/build-android.ts install';
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
    log.success('Updated package.json with build scripts');
  } catch (error) {
    log.warning('Could not update package.json. Add scripts manually.');
  }
}

// Run if called directly
if (require.main === module) {
  // Update package.json with scripts
  updatePackageJson();
  main().catch(console.error);
}

export {
  runEasBuild,
  runLocalBuild,
  installApk,
  checkPrerequisites,
};
