#!/bin/bash

# steady-run.sh: A wrapper script to monitor cron jobs with SteadyState
# This script runs a command, captures its duration, exit code, and logs,
# then sends the metadata to SteadyState.

# Usage: ./steady-run.sh --token <token> --command "npm run build"

TOKEN=""
COMMAND=""
API_URL="https://steady-state.vercel.app/api/ping" # Default URL, users should change this

usage() {
  echo "Usage: $0 --token <token> --command \"<command>\" [--url <api_url>]"
  echo ""
  echo "Options:"
  echo "  --token    The ping token for your heartbeat monitor (required)"
  echo "  --command  The command to execute and monitor (required)"
  echo "  --url      The base API URL for SteadyState (optional)"
  exit 1
}

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --token) TOKEN="$2"; shift ;;
    --command) COMMAND="$2"; shift ;;
    --url) API_URL="$2"; shift ;;
    *) usage ;;
  esac
  shift
done

if [[ -z "$TOKEN" || -z "$COMMAND" ]]; then
  usage
fi

# Ensure trailing slash is handled
API_URL="${API_URL%/}"

START_TIME=$(date +%s%3N)
LOG_FILE=$(mktemp)

echo "[SteadyState] Starting command: $COMMAND"
echo "[SteadyState] Started at: $(date)"

# Run the command and capture stdout and stderr
eval "$COMMAND" > "$LOG_FILE" 2>&1
EXIT_CODE=$?

END_TIME=$(date +%s%3N)
DURATION=$((END_TIME - START_TIME))
LOG_CONTENT=$(cat "$LOG_FILE")

echo "[SteadyState] Command finished with exit code: $EXIT_CODE"
echo "[SteadyState] Duration: ${DURATION}ms"

# Send the results to SteadyState using curl
# We use jq to safely encode the log string if available, otherwise we use a simple fallback
if command -v jq >/dev/null 2>&1; then
  JSON_PAYLOAD=$(jq -n \
    --arg duration "$DURATION" \
    --arg exitCode "$EXIT_CODE" \
    --arg log "$LOG_CONTENT" \
    '{duration: ($duration|tonumber), exitCode: ($exitCode|tonumber), log: $log}')
else
  # Fallback: simple escaping for log (not perfect, but works for most logs)
  # We replace double quotes and backslashes
  ESCAPED_LOG=$(echo "$LOG_CONTENT" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | awk '{printf "%s\\n", $0}' | sed 's/\\n$//')
  JSON_PAYLOAD="{\"duration\": $DURATION, \"exitCode\": $EXIT_CODE, \"log\": \"$ESCAPED_LOG\"}"
fi

echo "[SteadyState] Sending telemetry to $API_URL/$TOKEN..."

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API_URL}/${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$JSON_PAYLOAD")

if [ "$RESPONSE" -eq 200 ]; then
  echo "[SteadyState] Telemetry sent successfully."
else
  echo "[SteadyState] Error: Failed to send telemetry (HTTP $RESPONSE)."
fi

# Clean up
rm "$LOG_FILE"

# Exit with the original command's exit code
exit $EXIT_CODE
