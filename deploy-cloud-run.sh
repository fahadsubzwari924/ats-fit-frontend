#!/bin/bash

###############################################################################
# Google Cloud Run Deployment Script
# This script deploys the Angular SSR application to Google Cloud Run
###############################################################################

set -e  # Exit immediately if a command exits with a non-zero status
set -u  # Treat unset variables as an error
set -o pipefail  # Prevent errors in a pipeline from being masked

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
PROJECT_ID="${GCP_PROJECT_ID:-}"
SERVICE_NAME="${SERVICE_NAME:-resume-maker-fe}"
REGION="${GCP_REGION:-asia-south1}"
MEMORY="${MEMORY:-1Gi}"
CPU="${CPU:-1}"
MAX_INSTANCES="${MAX_INSTANCES:-100}"
MIN_INSTANCES="${MIN_INSTANCES:-0}"
CONCURRENCY="${CONCURRENCY:-80}"
TIMEOUT="${TIMEOUT:-300s}"

# Function to print colored messages
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to check if gcloud is installed
check_gcloud() {
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it from:"
        print_error "https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    print_success "gcloud CLI is installed"
}

# Function to check if user is authenticated
check_auth() {
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_warning "Not authenticated with gcloud. Running authentication..."
        gcloud auth login
    fi
    print_success "Authenticated with gcloud"
}

# Function to get or prompt for project ID
get_project_id() {
    if [ -z "$PROJECT_ID" ]; then
        # Try to get from gcloud config
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
        
        if [ -z "$PROJECT_ID" ]; then
            print_warning "No GCP project ID configured."
            echo -n "Enter your GCP Project ID: "
            read -r PROJECT_ID
        fi
    fi
    
    if [ -z "$PROJECT_ID" ]; then
        print_error "Project ID is required"
        exit 1
    fi
    
    print_info "Using Project ID: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
}

# Function to enable required APIs
enable_apis() {
    print_info "Enabling required Google Cloud APIs..."
    
    apis=(
        "run.googleapis.com"
        "cloudbuild.googleapis.com"
        "containerregistry.googleapis.com"
        "artifactregistry.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        print_info "Enabling $api..."
        gcloud services enable "$api" --project="$PROJECT_ID" 2>/dev/null || true
    done
    
    print_success "APIs enabled successfully"
}

# Function to build and push Docker image
build_and_push() {
    print_info "Building and pushing Docker image..."
    
    IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    IMAGE_TAG="$IMAGE_NAME:$TIMESTAMP"
    IMAGE_LATEST="$IMAGE_NAME:latest"
    
    print_info "Building image: $IMAGE_TAG"
    
    # Configure Docker to use gcloud as credential helper
    gcloud auth configure-docker gcr.io --quiet
    
    # Build the Docker image
    docker build -t "$IMAGE_TAG" -t "$IMAGE_LATEST" .
    
    print_success "Docker image built successfully"
    
    # Push to Container Registry
    print_info "Pushing image to Google Container Registry..."
    docker push "$IMAGE_TAG"
    docker push "$IMAGE_LATEST"
    
    print_success "Image pushed successfully"
    
    echo "$IMAGE_TAG"
}

# Function to deploy to Cloud Run
deploy_to_cloud_run() {
    local image=$1
    
    print_info "Deploying to Cloud Run..."
    print_info "Service Name: $SERVICE_NAME"
    print_info "Region: $REGION"
    print_info "Memory: $MEMORY"
    print_info "CPU: $CPU"
    
    gcloud run deploy "$SERVICE_NAME" \
        --image="$image" \
        --platform=managed \
        --region="$REGION" \
        --memory="$MEMORY" \
        --cpu="$CPU" \
        --timeout="$TIMEOUT" \
        --max-instances="$MAX_INSTANCES" \
        --min-instances="$MIN_INSTANCES" \
        --concurrency="$CONCURRENCY" \
        --port=8080 \
        --allow-unauthenticated \
        --set-env-vars="NODE_ENV=production" \
        --execution-environment=gen2 \
        --cpu-boost \
        --session-affinity \
        --project="$PROJECT_ID"
    
    print_success "Deployment completed successfully!"
}

# Function to get service URL
get_service_url() {
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --platform=managed \
        --region="$REGION" \
        --format='value(status.url)' \
        --project="$PROJECT_ID")
    
    print_success "Service URL: $SERVICE_URL"
}

# Function to deploy using Cloud Build
deploy_with_cloud_build() {
    print_info "Deploying using Cloud Build..."
    
    gcloud builds submit \
        --config=cloudbuild.yaml \
        --project="$PROJECT_ID" \
        --substitutions="_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION,_MEMORY=$MEMORY,_CPU=$CPU,_MAX_INSTANCES=$MAX_INSTANCES,_MIN_INSTANCES=$MIN_INSTANCES,_CONCURRENCY=$CONCURRENCY,_TIMEOUT=$TIMEOUT"
    
    print_success "Cloud Build deployment completed!"
}

# Main deployment function
main() {
    print_info "Starting deployment to Google Cloud Run..."
    echo
    
    # Pre-flight checks
    check_gcloud
    check_auth
    get_project_id
    enable_apis
    
    echo
    print_info "Choose deployment method:"
    echo "1) Deploy using Cloud Build (Recommended)"
    echo "2) Build locally and deploy"
    echo -n "Enter choice [1-2]: "
    read -r choice
    
    case $choice in
        1)
            deploy_with_cloud_build
            ;;
        2)
            IMAGE_TAG=$(build_and_push)
            deploy_to_cloud_run "$IMAGE_TAG"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo
    get_service_url
    
    echo
    print_success "🎉 Deployment completed successfully!"
    echo
    print_info "To view logs, run:"
    echo "  gcloud logs tail --service=$SERVICE_NAME --region=$REGION"
    echo
    print_info "To update environment variables, run:"
    echo "  gcloud run services update $SERVICE_NAME --region=$REGION --set-env-vars=KEY=VALUE"
}

# Run main function
main "$@"
