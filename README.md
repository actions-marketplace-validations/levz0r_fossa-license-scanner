# FOSSA License Scanner

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Flevgelfenbuim%2Ffossa-license-scanner.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Flevz0r%2Ffossa-license-scanner?ref=badge_shield)

A comprehensive GitHub Action for FOSSA license scanning with detailed PR comments and policy violation reporting. This action combines FOSSA analysis with intelligent reporting to help maintain license compliance in your projects.

## Features

- 🔍 **Automated FOSSA scanning** - Runs FOSSA analyze and test commands
- 💬 **Detailed PR comments** - Posts comprehensive violation details in pull requests
- 🛡️ **Policy enforcement** - Configurable failure on license violations
- 📊 **Rich reporting** - Detailed violation information with package names and licenses
- 🔗 **Dashboard integration** - Direct links to FOSSA dashboard for detailed analysis
- ⚡ **Easy setup** - Minimal configuration required

## Quick Start

```yaml
name: License Scan
on: [pull_request]

jobs:
  fossa-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: FOSSA License Scan
        uses: levgelfenbuim/fossa-license-scanner@v1
        with:
          api-key: ${{ secrets.FOSSA_API_KEY }}
          project: "my-project"
```

## Usage

### Basic Configuration

```yaml
- name: FOSSA License Scan
  uses: levgelfenbuim/fossa-license-scanner@v1
  with:
    api-key: ${{ secrets.FOSSA_API_KEY }}
    project: "my-project"
```

### Advanced Configuration

```yaml
- name: FOSSA License Scan
  uses: levgelfenbuim/fossa-license-scanner@v1
  with:
    api-key: ${{ secrets.FOSSA_API_KEY }}
    project: "my-project"
    branch: ${{ github.head_ref }}
    fail-on-violations: true
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Complete Workflow Example

```yaml
name: License Compliance

on:
  pull_request:
  push:
    branches: [main, develop]

permissions:
  contents: read
  pull-requests: write

jobs:
  fossa-scan:
    name: FOSSA License Scan
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Run FOSSA License Scan
        uses: levgelfenbuim/fossa-license-scanner@v1
        with:
          api-key: ${{ secrets.FOSSA_API_KEY }}
          project: "my-awesome-project"
          fail-on-violations: true

      - name: Handle scan results
        if: always()
        run: |
          echo "Violations found: ${{ steps.fossa-scan.outputs.violations-found }}"
          echo "Violations count: ${{ steps.fossa-scan.outputs.violations-count }}"
          echo "Dashboard: ${{ steps.fossa-scan.outputs.dashboard-url }}"
```

## Inputs

| Input                | Description                                                         | Required | Default        |
| -------------------- | ------------------------------------------------------------------- | -------- | -------------- |
| `api-key`            | FOSSA API key for authentication                                    | Yes      | -              |
| `project`            | Project name in FOSSA (must match your FOSSA project configuration) | Yes      | -              |
| `branch`             | Branch name to scan                                                 | No       | Current branch |
| `fail-on-violations` | Whether to fail the action when license policy violations are found | No       | `true`         |
| `github-token`       | GitHub token for posting PR comments                                | No       | `github.token` |

## Outputs

| Output             | Description                                                        |
| ------------------ | ------------------------------------------------------------------ |
| `violations-found` | Boolean indicating whether license policy violations were detected |
| `violations-count` | Number of license policy violations found                          |
| `dashboard-url`    | URL to the FOSSA dashboard for this project                        |

## PR Comments

The action automatically posts detailed comments on pull requests with:

### ✅ Clean Scan Results

- Clear indication when no violations are found
- Summary of scan status
- Links to FOSSA dashboard

### ⚠️ Violation Reports

- Detailed list of each license violation
- Package names and versions
- License types causing violations
- Policy rules that were triggered
- Direct links to FOSSA dashboard for each issue
- Actionable next steps

### ❌ Error Handling

- Clear error messages when scans fail
- Guidance on troubleshooting steps
- Links to logs and documentation

## Setup Guide

### 1. FOSSA Account Setup

1. Create a [FOSSA account](https://fossa.com)
2. Set up your project in FOSSA
3. Generate an API key from your FOSSA settings

### 2. GitHub Secrets Configuration

Add your FOSSA API key as a repository secret:

1. Go to your repository settings
2. Navigate to "Secrets and variables" → "Actions"
3. Add a new secret named `FOSSA_API_KEY`
4. Paste your FOSSA API key as the value

### 3. Permissions Setup

Ensure your workflow has the necessary permissions:

```yaml
permissions:
  contents: read # Required for checkout
  pull-requests: write # Required for PR comments
```

### 4. Project Name Configuration

The `project` input must exactly match your project name in FOSSA. You can find this in:

- Your FOSSA dashboard URL
- FOSSA project settings
- Previous FOSSA configuration files

## Troubleshooting

### Common Issues

**"Project not found" error:**

- Verify the `project` input matches your FOSSA project name exactly
- Check that your API key has access to the project
- Ensure the project exists in your FOSSA account

**"API key invalid" error:**

- Verify your `FOSSA_API_KEY` secret is set correctly
- Check that the API key hasn't expired
- Ensure the API key has the necessary permissions

**No PR comments appearing:**

- Verify the `github-token` has `pull-requests: write` permission
- Check that the action is running on `pull_request` events
- Ensure the workflow has `permissions.pull-requests: write`

**Scan failing on valid licenses:**

- Review your FOSSA project's license policy settings
- Check if new dependencies have been added
- Verify license compatibility with your project's requirements

### Debug Mode

Enable debug logging by setting the `ACTIONS_STEP_DEBUG` secret to `true` in your repository settings.

## Integration Examples

### With Different Package Managers

The action works with any project that FOSSA supports:

```yaml
# Node.js project
- name: Install dependencies
  run: npm install
- name: FOSSA Scan
  uses: levgelfenbuim/fossa-license-scanner@v1
  with:
    api-key: ${{ secrets.FOSSA_API_KEY }}
    project: "my-node-app"
```

```yaml
# Python project
- name: Install dependencies
  run: pip install -r requirements.txt
- name: FOSSA Scan
  uses: levgelfenbuim/fossa-license-scanner@v1
  with:
    api-key: ${{ secrets.FOSSA_API_KEY }}
    project: "my-python-app"
```

### With Build Matrices

```yaml
strategy:
  matrix:
    project: ["frontend", "backend", "mobile"]

steps:
  - uses: actions/checkout@v4
  - name: FOSSA Scan
    uses: levgelfenbuim/fossa-license-scanner@v1
    with:
      api-key: ${{ secrets.FOSSA_API_KEY }}
      project: ${{ matrix.project }}
```

### Conditional Execution

```yaml
- name: FOSSA Scan
  if: github.event_name == 'pull_request'
  uses: levgelfenbuim/fossa-license-scanner@v1
  with:
    api-key: ${{ secrets.FOSSA_API_KEY }}
    project: "my-project"
    fail-on-violations: ${{ github.base_ref == 'main' }}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

1. Fork this repository
2. Create a feature branch
3. Make your changes
4. Test with a real FOSSA project
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: [hi@lev.engineer](mailto:hi@lev.engineer)
- 🐛 Issues: [GitHub Issues](https://github.com/levgelfenbuim/fossa-license-scanner/issues)
- 📖 FOSSA Documentation: [FOSSA Docs](https://docs.fossa.com)

## Related

- [FOSSA CLI](https://github.com/fossas/fossa-cli) - Official FOSSA command line tool
- [FOSSA Action](https://github.com/marketplace/actions/fossa-action) - Official FOSSA GitHub Action
- [License Compliance Guide](https://fossa.com/blog/open-source-software-licenses-compliance-guide/)

---

_Made with ❤️ by [Lev Gelfenbuim](https://github.com/levgelfenbuim)_
