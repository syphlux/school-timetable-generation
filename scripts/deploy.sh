#!/usr/bin/env bash
# Builds the combined frontend+backend image, pushes to ECR, redeploys ECS.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INFRA="$ROOT/infra"

echo "Reading Terraform outputs..."
AWS_REGION=$(terraform -chdir="$INFRA" output -raw aws_region)
ECR_URL=$(terraform    -chdir="$INFRA" output -raw ecr_repository_url)
ECS_CLUSTER=$(terraform -chdir="$INFRA" output -raw ecs_cluster_name)
ECS_SERVICE=$(terraform -chdir="$INFRA" output -raw ecs_service_name)
APP_URL=$(terraform    -chdir="$INFRA" output -raw app_url)

echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "$ECR_URL"

echo "Building image (frontend + backend)..."
docker build --platform linux/amd64 -t "$ECR_URL:latest" "$ROOT"

echo "Pushing image to ECR..."
docker push "$ECR_URL:latest"

echo "Updating ECS service..."
aws ecs update-service \
  --cluster "$ECS_CLUSTER" \
  --service  "$ECS_SERVICE" \
  --force-new-deployment \
  --desired-count 1 \
  --region "$AWS_REGION" > /dev/null

echo "Waiting for ECS service to stabilise..."
aws ecs wait services-stable \
  --cluster  "$ECS_CLUSTER" \
  --services "$ECS_SERVICE" \
  --region   "$AWS_REGION"

echo ""
echo "Done — $APP_URL"
