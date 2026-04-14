#!/bin/sh
# Inject runtime environment variables into the frontend
# This allows VITE_API_URL to be set at container runtime

set -e

# Default API URL if not set
API_URL="${VITE_API_URL:-}"

# If API_URL is set, update the index.html or create a runtime config
if [ -n "$API_URL" ]; then
    echo "Setting API URL to: $API_URL"
    # Create a runtime config that the app can read
    cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_API_URL: "$API_URL"
};
EOF
fi
