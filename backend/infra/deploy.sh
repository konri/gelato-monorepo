#!/usr/bin/env bash
# Deploy to AWS ECS – build, push, deploy
set -euo pipefail

AWS_REGION="${AWS_REGION:-eu-central-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE="${ECR_REGISTRY}/bonapka-backend:latest"
CLUSTER="bonapka"
SERVICE="bonapka-backend"

echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"

echo "🔨 Building image..."
docker buildx build \
  --platform linux/amd64 \
  --provenance=false \
  --load \
  -t "${IMAGE}" \
  .

echo "🚀 Pushing to ECR..."
docker push "${IMAGE}"

echo "📝 Registering new task definition..."
aws ecs register-task-definition \
  --cli-input-json file://infra/ecs-task-definition.json \
  --region "${AWS_REGION}" \
  --query "taskDefinition.taskDefinitionArn" \
  --output text

echo "♻️  Deploying to ECS..."
aws ecs update-service \
  --cluster "${CLUSTER}" \
  --service "${SERVICE}" \
  --force-new-deployment \
  --region "${AWS_REGION}" \
  --query "service.{Status:status,Running:runningCount}" \
  --output table

echo "✅ Deploy triggered. Watch logs:"
echo "   aws logs tail /ecs/bonapka-backend --follow --region ${AWS_REGION}"
