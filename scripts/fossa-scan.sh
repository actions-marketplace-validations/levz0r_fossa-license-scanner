#!/bin/bash
set -e

# FOSSA License Scanner - Main scanning logic
# This script runs FOSSA test, captures results, and sets outputs for the GitHub Action

echo "🔍 Starting FOSSA license scan for project: ${FOSSA_PROJECT}"

# Initialize variables
VIOLATIONS_FOUND="false"
VIOLATIONS_COUNT="0"
DASHBOARD_URL="https://app.fossa.com/projects/custom%2B41069%2F${FOSSA_PROJECT}"

# Run FOSSA test and capture both exit code and output
set +e  # Don't exit on command failure
fossa test --project "${FOSSA_PROJECT}" --format json > fossa-results-raw.txt 2>&1
EXIT_CODE=$?
set -e  # Re-enable exit on error

echo "FOSSA test completed with exit code: ${EXIT_CODE}"

# Extract JSON from the output
if [ -f fossa-results-raw.txt ]; then
  # Look for JSON starting with { and extract it
  if grep -o '{.*}' fossa-results-raw.txt > fossa-results.json 2>/dev/null; then
    echo "✅ JSON results extracted successfully"
    
    # Try to parse and count violations
    if command -v jq >/dev/null 2>&1; then
      # Use jq if available for more reliable parsing
      ISSUES=$(jq -r '.issues // [] | length' fossa-results.json 2>/dev/null || echo "0")
      if [ "$ISSUES" != "0" ] && [ "$ISSUES" != "null" ]; then
        VIOLATIONS_FOUND="true"
        VIOLATIONS_COUNT="$ISSUES"
      fi
    else
      # Fallback: check if the file contains issues array with content
      if grep -q '"issues":\s*\[.\+\]' fossa-results.json; then
        VIOLATIONS_FOUND="true"
        # Simple count using grep (not perfect but functional)
        VIOLATIONS_COUNT=$(grep -o '"revisionId"' fossa-results.json | wc -l | tr -d ' ')
      fi
    fi
  else
    echo "⚠️  No JSON found in FOSSA output, creating empty results"
    echo '{"issues": []}' > fossa-results.json
  fi
else
  echo "⚠️  No FOSSA output file found, creating empty results"
  echo '{"issues": []}' > fossa-results.json
fi

# Set outputs for GitHub Actions
echo "violations-found=${VIOLATIONS_FOUND}" >> $GITHUB_OUTPUT
echo "violations-count=${VIOLATIONS_COUNT}" >> $GITHUB_OUTPUT
echo "dashboard-url=${DASHBOARD_URL}" >> $GITHUB_OUTPUT

# Set environment variables for the PR comment step
echo "FOSSA_EXIT_CODE=${EXIT_CODE}" >> $GITHUB_ENV
echo "VIOLATIONS_FOUND=${VIOLATIONS_FOUND}" >> $GITHUB_ENV
echo "VIOLATIONS_COUNT=${VIOLATIONS_COUNT}" >> $GITHUB_ENV

echo "📊 Scan Summary:"
echo "  - Violations found: ${VIOLATIONS_FOUND}"
echo "  - Violations count: ${VIOLATIONS_COUNT}"
echo "  - Dashboard URL: ${DASHBOARD_URL}"

# Handle failure conditions
if [ "${FAIL_ON_VIOLATIONS}" = "true" ]; then
  if [ "${VIOLATIONS_FOUND}" = "true" ] || [ "${EXIT_CODE}" = "1" ]; then
    if [ "${VIOLATIONS_FOUND}" = "true" ]; then
      echo "❌ Failing due to ${VIOLATIONS_COUNT} license policy violation(s)"
    else
      echo "❌ Failing due to FOSSA scan error (exit code: ${EXIT_CODE})"
    fi
    exit 1
  fi
fi

echo "✅ FOSSA scan completed successfully"