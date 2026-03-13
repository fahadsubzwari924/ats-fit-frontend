# Cloud Run Deployment

## Configuration

- **Project ID**: `ats-fit-frontend`
- **Service Name**: `resume-maker-fe`
- **Region**: `asia-south1`
- **Platform**: `managed`
- **Memory**: `1Gi`
- **CPU**: `1`
- **Environment**: `production`

## Deployment Commands

### Quick Deploy

```bash
./quick-deploy.sh
```

### Manual Deploy

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=ats-fit-frontend
```

### Set Public Access (if needed)

```bash
gcloud run services add-iam-policy-binding resume-maker-fe \
  --region=asia-south1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=ats-fit-frontend
```

## Service URL

```
https://resume-maker-fe-432417417625.asia-south1.run.app
```

## Health Check

```bash
curl https://resume-maker-fe-432417417625.asia-south1.run.app/health
```

## View Logs

```bash
gcloud logs tail --service=resume-maker-fe --region=asia-south1
```
