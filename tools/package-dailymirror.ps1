param([ValidateSet('all', 'windows', 'android')][string]$Target = 'all')
$ErrorActionPreference = 'Stop'
$sourceRoot = Split-Path $PSScriptRoot -Parent
$projectRoot = Split-Path $sourceRoot -Parent
Set-Location $sourceRoot

function Invoke-Checked([scriptblock]$Action) {
    & $Action
    if ($LASTEXITCODE -ne 0) { throw "Build failed with exit code $LASTEXITCODE" }
}

Invoke-Checked { node tools/generate-dailymirror-icons.cjs }
Invoke-Checked { npm run buildFrontend:prod:es6 }

if ($Target -in @('all', 'windows')) {
    Invoke-Checked { npm run electron:build }
    $env:ELECTRON_BUILDER_CACHE = Join-Path $sourceRoot '.tmp/builder-cache'
    $env:ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/'
    $env:CSC_IDENTITY_AUTO_DISCOVERY = 'false'
    Invoke-Checked {
        node node_modules/electron-builder/cli.js --config electron-builder.dailymirror.cjs --win --x64 --publish never --config.electronDist=node_modules/electron/dist
    }
}

if ($Target -in @('all', 'android')) {
    $toolchains = Join-Path $projectRoot '.toolchains'
    $javaDir = Get-ChildItem (Join-Path $toolchains 'java') -Directory | Select-Object -First 1
    $env:JAVA_HOME = $javaDir.FullName
    $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
    $env:GRADLE_USER_HOME = Join-Path $toolchains 'gradle-cache'
    $sdkDir = (Join-Path $toolchains 'android-sdk').Replace('\', '/')
    [IO.File]::WriteAllText((Join-Path $sourceRoot 'android/local.properties'), "sdk.dir=$sdkDir`n")
    $signingPath = Join-Path $sourceRoot 'android/dailymirror-signing.properties'
    if (!(Test-Path $signingPath)) {
        $secretBytes = New-Object byte[] 24
        $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
        try { $rng.GetBytes($secretBytes) } finally { $rng.Dispose() }
        $secret = [BitConverter]::ToString($secretBytes).Replace('-', '').ToLowerInvariant()
        $env:DAILYMIRROR_KEY_PASSWORD = $secret
        try {
            Invoke-Checked {
                & "$env:JAVA_HOME/bin/keytool.exe" -genkeypair -keystore android/dailymirror-release.p12 -storetype PKCS12 -storepass:env DAILYMIRROR_KEY_PASSWORD -keypass:env DAILYMIRROR_KEY_PASSWORD -alias dailymirror -keyalg RSA -keysize 3072 -validity 10000 -dname 'CN=DailyMirror'
            }
            [IO.File]::WriteAllText($signingPath, "storeFile=dailymirror-release.p12`nstorePassword=$secret`nkeyAlias=dailymirror`nkeyPassword=$secret`n")
        } finally { Remove-Item Env:DAILYMIRROR_KEY_PASSWORD }
    }
    New-Item -ItemType Directory -Force dist/browser | Out-Null
    Copy-Item .tmp/angular-dist/browser/* dist/browser -Recurse -Force
    Invoke-Checked { npm run sync:android }
    Copy-Item LICENSE android/app/src/main/assets/public/LICENSE.txt -Force
    Copy-Item .tmp/angular-dist/3rdpartylicenses.txt android/app/src/main/assets/public/3rdpartylicenses.txt -Force
    Set-Location android
    Invoke-Checked {
        & (Join-Path $toolchains 'gradle/gradle-8.14.3/bin/gradle.bat') assembleFdroidRelease --no-daemon --console=plain
    }
    $androidOutput = Join-Path $projectRoot 'releases/android'
    New-Item -ItemType Directory -Force $androidOutput | Out-Null
    $version = (Get-Content (Join-Path $sourceRoot 'package.json') -Raw | ConvertFrom-Json).version
    Copy-Item app/build/outputs/apk/fdroid/release/app-fdroid-release.apk (Join-Path $androidOutput "DailyMirror-$version-android.apk") -Force
}
Write-Host 'DailyMirror packages are in the releases folder.'
