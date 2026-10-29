"""Validate DailyMirror profiles and create Xcode's manual export options."""
import argparse
import datetime
import hashlib
import plistlib
import re
import shutil
import subprocess
from pathlib import Path

BUNDLE_IDS = ('com.dailymirror.app', 'com.dailymirror.app.ShareExtension')
APP_GROUP = 'group.com.dailymirror.app'


def validate_profile(profile, bundle_id, team, method, identities):
    entitlements = profile.get('Entitlements', {})
    if profile.get('TeamIdentifier') != [team]:
        raise ValueError(f'{bundle_id}: Apple Team ID does not match')
    # AppIdentifierPrefix can differ from TeamIdentifier on older accounts.
    app_id = entitlements.get('application-identifier', '')
    if app_id.split('.', 1)[-1] != bundle_id:
        raise ValueError(f'{bundle_id}: wrong profile application identifier')
    if APP_GROUP not in entitlements.get('com.apple.security.application-groups', []):
        raise ValueError(f'{bundle_id}: profile must enable {APP_GROUP}')
    expiration = profile.get('ExpirationDate')
    if not expiration or expiration.replace(tzinfo=datetime.timezone.utc) <= datetime.datetime.now(datetime.timezone.utc):
        raise ValueError(f'{bundle_id}: provisioning profile expired')
    if entitlements.get('get-task-allow') or profile.get('ProvisionsAllDevices'):
        raise ValueError(f'{bundle_id}: use an Apple Distribution profile, not Development/Enterprise')
    devices = set(profile.get('ProvisionedDevices', []))
    if (method == 'release-testing') != bool(devices):
        raise ValueError(f'{bundle_id}: profile type does not match {method}')
    uuid = profile.get('UUID', '')
    if not re.fullmatch(r'[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}', uuid):
        raise ValueError(f'{bundle_id}: invalid profile UUID')
    certificates = {hashlib.sha1(cert).hexdigest().upper() for cert in profile.get('DeveloperCertificates', [])}
    usable = certificates & identities
    if not usable:
        raise ValueError(f'{bundle_id}: no matching signing certificate/private key in the keychain')
    return usable, devices


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--team', required=True)
    parser.add_argument('--method', choices=('release-testing', 'app-store-connect'), default='release-testing')
    parser.add_argument('--app-profile', type=Path, required=True)
    parser.add_argument('--share-profile', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'[A-Z0-9]{10}', args.team):
        parser.error('Apple Team ID must contain 10 uppercase letters/digits')
    identity_text = subprocess.check_output(['security', 'find-identity', '-v', '-p', 'codesigning'], text=True)
    identities = set(re.findall(r'\b[0-9A-F]{40}\b', identity_text))
    profiles = []
    certificates = identities.copy()
    device_sets = []
    for bundle_id, path in zip(BUNDLE_IDS, (args.app_profile, args.share_profile)):
        profile = plistlib.loads(subprocess.check_output(['security', 'cms', '-D', '-i', str(path)]))
        usable, devices = validate_profile(profile, bundle_id, args.team, args.method, identities)
        certificates &= usable
        profiles.append(profile)
        device_sets.append(devices)
    if not certificates:
        raise ValueError('App and ShareExtension profiles must use the same installed signing certificate')
    if args.method == 'release-testing' and not device_sets[0].issubset(device_sets[1]):
        raise ValueError('ShareExtension profile must include every device registered in the app profile')
    destination = Path.home() / 'Library/MobileDevice/Provisioning Profiles'
    destination.mkdir(parents=True, exist_ok=True)
    for profile, path in zip(profiles, (args.app_profile, args.share_profile)):
        installed = destination / (profile['UUID'] + '.mobileprovision')
        if path.resolve() != installed.resolve():
            shutil.copyfile(path, installed)
    options = {
        'method': args.method, 'destination': 'export', 'teamID': args.team,
        'signingStyle': 'manual', 'signingCertificate': sorted(certificates)[0],
        'provisioningProfiles': {bundle_id: profile['UUID'] for bundle_id, profile in zip(BUNDLE_IDS, profiles)},
        'stripSwiftSymbols': True,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(plistlib.dumps(options))
    print(f'DailyMirror signing profiles validated ({args.method}); export options created.')


if __name__ == '__main__':
    main()
