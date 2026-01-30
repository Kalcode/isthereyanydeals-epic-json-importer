#!/bin/bash
# Create a pull request on Gitea/Forgejo
# Usage: ./scripts/create-pr.sh "PR Title" "PR Body" [base-branch] [head-branch]

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check for required env var
if [ -z "$GITEA_TOKEN" ]; then
    echo "Error: GITEA_TOKEN not found in .env"
    exit 1
fi

# Arguments
TITLE="${1:-}"
BODY="${2:-}"
BASE="${3:-main}"
HEAD="${4:-$(git branch --show-current)}"

if [ -z "$TITLE" ]; then
    echo "Usage: $0 \"PR Title\" \"PR Body\" [base-branch] [head-branch]"
    echo ""
    echo "Example:"
    echo "  $0 \"feat: Add new feature\" \"Description of changes\""
    exit 1
fi

# Get repo info from git remote
REMOTE_URL=$(git remote get-url origin)
# Extract owner/repo from URL (handles both HTTPS and SSH)
REPO_PATH=$(echo "$REMOTE_URL" | sed -E 's#.*(kalcode/[^/]+)(\.git)?$#\1#' | sed 's/\.git$//')

# Gitea API endpoint
API_BASE="https://code.clausens.cloud/api/v1"

echo "Creating PR..."
echo "  Title: $TITLE"
echo "  Base:  $BASE"
echo "  Head:  $HEAD"
echo "  Repo:  $REPO_PATH"
echo ""

# Create PR
RESPONSE=$(curl -s -X POST "$API_BASE/repos/$REPO_PATH/pulls" \
  -H "Authorization: token $GITEA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"$TITLE\",
    \"body\": \"$BODY\",
    \"head\": \"$HEAD\",
    \"base\": \"$BASE\"
  }")

# Extract PR URL
PR_URL=$(echo "$RESPONSE" | grep -o '"html_url":"[^"]*' | cut -d'"' -f4)

if [ -n "$PR_URL" ]; then
    echo "✅ PR created successfully!"
    echo "$PR_URL"
else
    echo "❌ Failed to create PR"
    echo "$RESPONSE"
    exit 1
fi
