#!/usr/bin/env python3
"""Regression checks for the TEST deployment trust boundary; never runs a deployment."""
from pathlib import Path
import json
import unittest
import yaml

ROOT = Path(__file__).resolve().parents[2]
DEPLOY = next((ROOT / '.github/workflows').glob('*railway-test.yml'), None) or ROOT / '.github/workflows/build-preview-apk.yml'
GUARD = "github.ref == 'refs/heads/test' && github.event_name == 'workflow_dispatch' && github.actor == github.repository_owner && github.triggering_actor == github.repository_owner && inputs.approved_sha == github.sha && needs.security_gate.result == 'success'"

def read(path):
    return yaml.load(Path(path).read_text(), Loader=yaml.BaseLoader)

def validate(workflow, reusable):
    jobs = workflow.get('jobs', {})
    gate = jobs.get('security_gate', {})
    assert gate.get('uses') == './.github/workflows/security-checks.yml', 'gate must use this commit'
    assert not gate.get('if'), 'required gate must not be conditional'
    assert gate.get('continue-on-error', 'false') == 'false', 'gate must fail closed'
    assert workflow.get('on', {}).get('push', {}).get('branches') == ['test'], 'TEST push only'
    approval = workflow.get('on', {}).get('workflow_dispatch', {}).get('inputs', {}).get('approved_sha', {})
    assert approval.get('required') == 'true' and approval.get('type') == 'string', 'reviewed SHA must be explicit'
    deploys = [job for key, job in jobs.items() if key != 'security_gate']
    assert deploys, 'deployment job missing'
    for job in deploys:
        needs = job.get('needs', [])
        if isinstance(needs, str): needs = [needs]
        assert 'security_gate' in needs, 'deployment must depend on security_gate'
        assert job.get('if') == GUARD, 'deployment must require TEST ref and successful gate'
    assert 'workflow_call' in reusable.get('on', {}), 'gate must be reusable'
    test_commands = []
    for job in reusable.get('jobs', {}).values():
        assert not job.get('if'), 'security checks must run unconditionally'
        assert job.get('continue-on-error', 'false') == 'false', 'failed security jobs cannot pass'
        for step in job.get('steps', []):
            if step.get('uses', '').startswith('actions/checkout@'):
                assert step.get('with', {}).get('ref') in [None, '${{ github.sha }}'], 'checks must use the running commit'
            assert step.get('continue-on-error', 'false') == 'false', 'failed security steps cannot pass'
            command = step.get('run', '')
            if '--list-tests' not in command and any(token in command for token in ['dotnet test ', 'npm test', 'npx vitest run']):
                assert not step.get('if'), 'required regression tests cannot be skipped'
                assert not any(token in command for token in ['|| true', 'exit 0']), 'regression suite must fail closed'
                test_commands.append(command)
    assert test_commands, 'security/regression commands missing'
    assert all('--filter' not in command for command in test_commands), 'full regression suite must not be filtered'


class DeploymentGateTests(unittest.TestCase):
    def setUp(self):
        self.workflow = read(DEPLOY)
        self.reusable = read(ROOT / '.github/workflows/security-checks.yml')
        self.job = next(j for k,j in self.workflow['jobs'].items() if k != 'security_gate')
    def test_reviewed_workflow_is_accepted(self): validate(self.workflow, self.reusable)
    def test_mobile_node_versions_are_consistent_and_supported(self):
        versions = []
        for workflow in [self.workflow, self.reusable]:
            for job in workflow['jobs'].values():
                versions.extend(step['with']['node-version'] for step in job.get('steps', []) if step.get('uses', '').startswith('actions/setup-node@'))
        versions.append(json.loads((ROOT / 'eas.json').read_text())['build']['preview']['node'])
        self.assertTrue(versions)
        self.assertEqual(set(versions), {'22.23.4'})
    def test_missing_dependency_is_refused(self):
        self.job.pop('needs', None)
        with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
    def test_failure_bypass_is_refused(self):
        self.job['if'] = 'always()'
        with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
    def test_manual_dispatch_from_another_branch_is_refused(self):
        self.job['if'] = "needs.security_gate.result == 'success'"
        with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
    def test_owner_authorization_cannot_be_removed(self):
        for clause in ["github.event_name == 'workflow_dispatch'", 'github.actor == github.repository_owner', 'github.triggering_actor == github.repository_owner', 'inputs.approved_sha == github.sha']:
            original = self.job['if']
            self.job['if'] = original.replace(clause + ' && ', '')
            with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
            self.job['if'] = original
    def test_approval_sha_cannot_be_optional(self):
        self.workflow['on']['workflow_dispatch']['inputs']['approved_sha']['required'] = 'false'
        with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
    def test_checkout_cannot_switch_the_tested_commit(self):
        job = next(iter(self.reusable['jobs'].values()))
        checkout = next(step for step in job['steps'] if step.get('uses', '').startswith('actions/checkout@'))
        checkout['with'] = {'ref': 'dev'}
        with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
    def test_a_different_commit_cannot_supply_the_gate(self):
        self.workflow['jobs']['security_gate']['uses'] += '@dev'
        with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
    def test_soft_failed_gate_is_refused(self):
        self.workflow['jobs']['security_gate']['continue-on-error'] = 'true'
        with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
    def test_skipped_gate_is_refused(self):
        self.workflow['jobs']['security_gate']['if'] = 'false'
        with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
    def test_no_tests_is_refused(self):
        self.reusable['jobs'] = {}
        with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
    def test_soft_failed_regression_step_is_refused(self):
        job = next(iter(self.reusable['jobs'].values()))
        job['steps'].append({'run': 'npm test', 'continue-on-error': 'true'})
        with self.assertRaises(AssertionError): validate(self.workflow, self.reusable)
    def test_test_push_does_not_duplicate_standalone_ci(self):
        ci = next((ROOT / '.github/workflows').glob('security-ci.yml'), ROOT / '.github/workflows/ci.yml')
        workflow = read(ci)
        self.assertNotIn('test', workflow.get('on', {}).get('push', {}).get('branches', []))

if __name__ == '__main__': unittest.main()
