# Docker Deployment Guide

This guide provides instructions for containerizing and deploying the Angular SSR application to Google Cloud Run.

## Prerequisites

- Docker installed on your machine
- Google Cloud SDK (gcloud) installed and configured
- A Google Cloud Project with billing enabled
- Container Registry or Artifact Registry API enabled

## Local Development

For local development, continue using the standard Angular CLI commands:

```bash
# Development server
npm start

# Development with SSR
npm run dev:ssr

# Build for development
npm run build

# Run tests
npm test
```

## Docker Build and Deployment

### 1. Build Docker Image Locally

```bash
# Build the Docker image
docker build -t resume-maker-fe .

# Run locally to test
docker run -p 8080:8080 resume-maker-fe
```

### 2. Test with Docker Compose

```bash
# Run with docker-compose
docker-compose up

# Run in detached mode
docker-compose up -d

# Stop services
docker-compose down
```

### 3. Deploy to Google Cloud Run

#### Option A: Build and Deploy with Cloud Build

```bash
# Set your project ID
export PROJECT_ID=your-project-id
export SERVICE_NAME=resume-maker-fe
export REGION=us-central1

# Submit build to Cloud Build and deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated
```

#### Option B: Build Locally and Push to Container Registry

```bash
# Set your project ID
export PROJECT_ID=your-project-id
export SERVICE_NAME=resume-maker-fe
export REGION=us-central1

# Configure Docker for gcloud
gcloud auth configure-docker

# Build and tag the image
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME .

# Push to Container Registry
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 100 \
  --concurrency 80
```

#### Option C: Using Artifact Registry (Recommended)

```bash
# Create Artifact Registry repository (one-time setup)
gcloud artifacts repositories create $SERVICE_NAME \
  --repository-format=docker \
  --location=$REGION \
  --project=$PROJECT_ID

# Configure Docker for Artifact Registry
gcloud auth configure-docker $REGION-docker.pkg.dev

# Build and tag the image
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/$SERVICE_NAME .

# Push to Artifact Registry
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/$SERVICE_NAME

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --image $REGION-docker.pkg.dev/$PROJECT_ID/$SERVICE_NAME/$SERVICE_NAME \
  --platform managed \
  --region $REGION \
  --project $PROJECT_ID \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 100 \
  --concurrency 80
```

### 4. Environment Variables

If you need to set environment variables for your production deployment:

```bash
gcloud run services update $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --update-env-vars="NODE_ENV=production,API_BASE_URL=https://your-api.com"
```

### 5. Custom Domain (Optional)

To map a custom domain to your Cloud Run service:

```bash
# Map domain
gcloud run domain-mappings create \
  --service $SERVICE_NAME \
  --domain your-domain.com \
  --region $REGION \
  --project $PROJECT_ID
```

## Docker Configuration Details

### Multi-stage Build

- **Build Stage**: Uses Node.js 18 Alpine to install dependencies and build the Angular SSR application
- **Production Stage**: Creates a minimal runtime image with only production dependencies

### Security Features

- Runs as non-root user (angular:nodejs)
- Minimal attack surface with Alpine Linux
- Health checks for container monitoring

### Optimization Features

- Multi-stage build reduces final image size
- `.dockerignore` excludes unnecessary files
- Production-only npm dependencies
- Efficient layer caching

### Google Cloud Run Optimizations

- Uses PORT environment variable (required by Cloud Run)
- Health check endpoint for monitoring
- Optimized memory and CPU settings
- Proper signal handling for graceful shutdowns

## Troubleshooting

### Common Issues

1. **Build fails**: Ensure all dependencies are properly listed in `package.json`
2. **Container doesn't start**: Check the health check logs and ensure port 8080 is accessible
3. **SSR not working**: Verify the Angular SSR build configuration in `angular.json`

### Debugging

```bash
# Check container logs
docker logs <container-id>

# Check Cloud Run logs
gcloud logs read --service=$SERVICE_NAME --region=$REGION

# Connect to running container
docker exec -it <container-id> /bin/sh
```

## Performance Tuning

For production workloads, consider:

- Adjusting `--memory` and `--cpu` based on load testing
- Implementing caching strategies for static assets
- Using Cloud CDN for global content delivery
- Monitoring with Cloud Monitoring and Logging

## Cost Optimization

- Use `--min-instances=0` for automatic scaling to zero
- Set appropriate `--max-instances` to control costs
- Monitor usage with Cloud Billing alerts
