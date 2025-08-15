/**
 * FOSSA License Scanner - PR Comment Generator
 * Generates detailed PR comments based on FOSSA scan results
 */

module.exports = async ({github, context, core}) => {
  const fs = require('fs');
  
  // Read FOSSA results
  let fossaResults = null;
  let rawResults = null;
  
  try {
    const rawData = fs.readFileSync('fossa-results.json', 'utf8');
    if (rawData.trim() === '[]' || rawData.trim() === '' || rawData.trim() === '{"issues": []}') {
      fossaResults = null;
    } else {
      rawResults = JSON.parse(rawData);
      // Handle both array format and object with issues array
      fossaResults = rawResults.issues || rawResults;
    }
  } catch (e) {
    console.log('Error reading FOSSA results:', e.message);
    fossaResults = null;
  }
  
  // Get environment variables
  const exitCode = process.env.FOSSA_EXIT_CODE;
  const violationsFound = process.env.VIOLATIONS_FOUND === 'true';
  const violationsCount = process.env.VIOLATIONS_COUNT || '0';
  const projectName = process.env.FOSSA_PROJECT || 'unknown';
  
  // Build comment message
  let message = "## 🔍 FOSSA License Scan Results\n\n";
  
  // Check if we have issues in the results
  const hasIssues = fossaResults && Array.isArray(fossaResults) && fossaResults.length > 0;
  
  if (hasIssues) {
    message += "### ⚠️ License Compliance Issues Found\n\n";
    message += `Found ${fossaResults.length} license policy violation${fossaResults.length > 1 ? 's' : ''}:\n\n`;
    
    fossaResults.forEach((issue, index) => {
      message += `**${index + 1}. License Policy Violation**\n`;
      
      if (issue.license) {
        message += `- **License**: ${issue.license}\n`;
      }
      
      if (issue.revisionId) {
        // Extract package name from revisionId (format: npm+package@version)
        const packageMatch = issue.revisionId.match(/npm\+([^$]+)$/);
        const packageName = packageMatch ? packageMatch[1] : issue.revisionId;
        message += `- **Package**: \`${packageName}\`\n`;
      }
      
      if (issue.type) {
        message += `- **Type**: ${issue.type}\n`;
      }
      
      if (issue.rule && issue.rule.title) {
        message += `- **Rule**: ${issue.rule.title}\n`;
      }
      
      if (issue.issueDashURL) {
        message += `- **Details**: [View in FOSSA Dashboard](${issue.issueDashURL})\n`;
      }
      
      message += "\n";
    });
    
    message += "### 📋 Next Steps\n";
    message += "1. Review the license violations above\n";
    message += "2. Consider replacing dependencies with incompatible licenses\n";
    message += "3. Consult with legal team if needed\n";
    message += "4. Update your project's license policy if appropriate\n\n";
    
  } else if (exitCode === '0') {
    message += "### ✅ All Clear!\n\n";
    message += "No license compliance issues found. Your dependencies are compliant with the configured policies.\n\n";
    
  } else if (exitCode === '1' && !hasIssues) {
    message += "### ❌ Policy Violations Found\n\n";
    message += "FOSSA detected license policy violations, but could not parse the detailed results. Please check the workflow logs and FOSSA dashboard for details.\n\n";
    
  } else {
    message += "### ❌ Scan Failed\n\n";
    message += `The FOSSA scan encountered an error (exit code: ${exitCode}). Please check the workflow logs for details.\n\n`;
  }
  
  // Add summary statistics
  message += "### 📊 Scan Summary\n";
  message += `- **Project**: ${projectName}\n`;
  message += `- **Violations Found**: ${violationsFound ? 'Yes' : 'No'}\n`;
  if (violationsFound) {
    message += `- **Total Violations**: ${violationsCount}\n`;
  }
  message += `- **Exit Code**: ${exitCode}\n\n`;
  
  // Add footer with links
  message += "---\n";
  message += `🔗 [View detailed report in FOSSA Dashboard](https://app.fossa.com/projects/custom%2B41069%2F${projectName})\n`;
  message += `📊 [FOSSA Status](https://app.fossa.com/projects/custom%2B41069%2F${projectName}?ref=badge_small)\n\n`;
  message += "*Scan powered by [FOSSA License Scanner](https://github.com/marketplace/actions/fossa-license-scanner)*";
  
  console.log('Posting PR comment with FOSSA results...');
  console.log(`Violations found: ${violationsFound}, Count: ${violationsCount}, Exit code: ${exitCode}`);
  
  try {
    // Check if we already posted a comment
    const comments = await github.rest.issues.listComments({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: context.issue.number,
    });
    
    const existingComment = comments.data.find(comment => 
      comment.body.includes('🔍 FOSSA License Scan Results') &&
      comment.user.type === 'Bot'
    );
    
    if (existingComment) {
      // Update existing comment
      await github.rest.issues.updateComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        comment_id: existingComment.id,
        body: message
      });
      console.log('Updated existing FOSSA comment');
    } else {
      // Create new comment
      await github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: message
      });
      console.log('Posted new FOSSA comment');
    }
    
  } catch (error) {
    console.error('Error posting PR comment:', error.message);
    core.warning(`Failed to post PR comment: ${error.message}`);
  }
};