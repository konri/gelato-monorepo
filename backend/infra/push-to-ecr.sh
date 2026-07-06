#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# push-to-ecr.sh  –  Build Docker image and push to AWS ECR
#
# Usage:
#   ./scripts/push-to-ecr.sh [TAG]
#
# Prerequisites:
#   - AWS CLI v2 installed and configured (aws configure)
#   - Docker running
#   - ECR repository already created (or set CREATE_REPO=1)
#
# Environment variables (override defaults):
#   AWS_REGION      – default: eu-central-1
#   AWS_ACCOUNT_ID  – auto-detected via STS if not set
#   ECR_REPO_NAME   – default: easybons-backend
#   IMAGE_TAG       – default: first arg or "latest"
#   CREATE_REPO     – set to "1" to create the ECR repo if it doesn't exist
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
AWS_REGION="${AWS_REGION:-eu-central-1}"
ECR_REPO_NAME="${ECR_REPO_NAME:-bonapka-backend}"
IMAGE_TAG="${1:-${IMAGE_TAG:-latest}}"
CREATE_REPO="${CREATE_REPO:-0}"

# ── Resolve AWS account ID ────────────────────────────────────────────────────
if [ -z "${AWS_ACCOUNT_ID:-}" ]; then
  echo "🔍 Detecting AWS Account ID..."
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
fi

ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE="${ECR_REGISTRY}/${ECR_REPO_NAME}:${IMAGE_TAG}"

echo "──────────────────────────────────────────────"
echo "  Region  : ${AWS_REGION}"
echo "  Account : ${AWS_ACCOUNT_ID}"
echo "  Repo    : ${ECR_REPO_NAME}"
echo "  Tag     : ${IMAGE_TAG}"
echo "  Image   : ${FULL_IMAGE}"
echo "──────────────────────────────────────────────"

# ── Optionally create ECR repo ────────────────────────────────────────────────
if [ "${CREATE_REPO}" = "1" ]; then
  echo "📦 Creating ECR repository (if not exists)..."
  aws ecr describe-repositories \
    --repository-names "${ECR_REPO_NAME}" \
    --region "${AWS_REGION}" > /dev/null 2>&1 || \
  aws ecr create-repository \
    --repository-name "${ECR_REPO_NAME}" \
    --region "${AWS_REGION}" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    --output table
fi

# ── ECR login ─────────────────────────────────────────────────────────────────
echo "🔐 Logging in to ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"

# ── Build ─────────────────────────────────────────────────────────────────────
echo "🔨 Building Docker image..."
# Remove local dist to prevent DOCKER_BUILDKIT=0 from copying stale files
rm -rf dist
docker buildx build \
  --platform linux/amd64 \
  --build-arg NODE_ENV=production \
  --provenance=false \
  --load \
  -t "${ECR_REPO_NAME}:${IMAGE_TAG}" \
  -t "${FULL_IMAGE}" \
  .

# ── Push ──────────────────────────────────────────────────────────────────────
echo "🚀 Pushing to ECR..."
docker push "${FULL_IMAGE}"

echo ""
echo "✅ Done! Image pushed:"
echo "   ${FULL_IMAGE}"
echo ""
echo "Next steps:"
echo "  1. Update your ECS task definition with the new image URI above"
echo "  2. Run: aws ecs update-service --cluster easybons --service easybons-backend --force-new-deployment --region ${AWS_REGION}"
