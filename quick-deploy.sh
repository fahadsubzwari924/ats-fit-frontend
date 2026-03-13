#!/bin/bash

###############################################################################
# Quick Deploy Script for Google Cloud Run
# Simple deployment script using Cloud Build
###############################################################################

set -e

# Default configuration
PROJECT_ID="${GCP_PROJECT_ID:-ats-fit-frontend}"
SERVICE_NAME="${SERVICE_NAME:-resume-maker-fe}"
REGION="${GCP_REGION:-asia-south1}"

echo "🚀 Quick Deploy to Google Cloud Run"
echo "===================================="
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo

# Deploy using Cloud Build
echo "📦 Building and deploying with Cloud Build..."
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project="$PROJECT_ID" \
  --substitutions="_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION"

echo
echo "✅ Deployment complete!"
echo

# Ensure public access is enabled
echo "🔓 Ensuring public access..."
gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
  --region="$REGION" \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project="$PROJECT_ID" \
  --quiet 2>/dev/null || echo "IAM policy already set"

echo

# Get service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --platform=managed \
  --region="$REGION" \
  --format='value(status.url)' \
  --project="$PROJECT_ID")

echo "🌐 Service URL: $SERVICE_URL"
echo "🏥 Health Check: $SERVICE_URL/health"
echo
