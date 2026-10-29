"""Profile rejection checks; no Apple credentials or macOS are required."""
import copy
import datetime
import hashlib
import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('signing', Path(__file__).with_name('prepare-dailymirror-ios-signing.py'))
signing = importlib.util.module_from_spec(spec)
spec.loader.exec_module(signing)


class ProfileValidationTests(unittest.TestCase):
    def setUp(self):
        certificate = b'fixture certificate, not a real credential'
        self.identities = {hashlib.sha1(certificate).hexdigest().upper()}
        self.profile = {
            'UUID': '00000000-0000-0000-0000-000000000001',
            'TeamIdentifier': ['TESTTEAM01'],
            'ExpirationDate': datetime.datetime.now() + datetime.timedelta(days=1),
            'DeveloperCertificates': [certificate],
            'ProvisionedDevices': ['fixture-device'],
            'Entitlements': {
                'application-identifier': 'OLDPREFIX1.com.dailymirror.app',
                'get-task-allow': False,
                'com.apple.security.application-groups': [signing.APP_GROUP],
            },
        }

    def check_profile(self, profile=None, method='release-testing'):
        return signing.validate_profile(profile or self.profile, signing.BUNDLE_IDS[0], 'TESTTEAM01', method, self.identities)

    def test_registered_devices_and_legacy_account_prefix_are_supported(self):
        certificates, devices = self.check_profile()
        self.assertEqual(certificates, self.identities)
        self.assertEqual(devices, {'fixture-device'})

    def test_rejects_wrong_team_bundle_group_certificate_and_expiration(self):
        for field, value in [('TeamIdentifier', ['WRONGTEAM1']), ('DeveloperCertificates', [b'other certificate']), ('ExpirationDate', datetime.datetime(2000, 1, 1)), ('UUID', '../../invalid')]:
            with self.subTest(field=field):
                profile = copy.deepcopy(self.profile)
                profile[field] = value
                with self.assertRaises(ValueError):
                    self.check_profile(profile)
        for field, value in [('application-identifier', 'TESTTEAM01.com.super-productivity.app'), ('com.apple.security.application-groups', []), ('get-task-allow', True)]:
            with self.subTest(field=field):
                profile = copy.deepcopy(self.profile)
                profile['Entitlements'][field] = value
                with self.assertRaises(ValueError):
                    self.check_profile(profile)

    def test_rejects_store_profile_for_registered_devices(self):
        self.profile.pop('ProvisionedDevices')
        with self.assertRaises(ValueError):
            self.check_profile()
        self.check_profile(method='app-store-connect')

    def test_rejects_registered_device_profile_for_store(self):
        with self.assertRaises(ValueError):
            self.check_profile(method='app-store-connect')

    def test_rejects_enterprise_profile(self):
        self.profile['ProvisionsAllDevices'] = True
        with self.assertRaises(ValueError):
            self.check_profile()


if __name__ == '__main__':
    unittest.main()
