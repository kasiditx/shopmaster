#!/bin/bash

# ShopMaster Rollback Script
# This script helps with rolling back deployments

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "ℹ $1"
}

# Check if environment is provided
if [ -z "$1" ]; then
    print_error "Environment not specified"
    echo "Usage: ./scripts/rollback.sh [staging|production] [version]"
    exit 1
fi

ENVIRONMENT=$1
VERSION=${2:-"previous"}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: staging, production"
    exit 1
fi

print_warning "⚠️  ROLLBACK WARNING ⚠️"
print_warning "You are about to rollback $ENVIRONMENT to version: $VERSION"
print_warning "This action should only be performed if there is a critical issue"
echo ""
read -p "Are you sure you want to continue? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    print_info "Rollback cancelled"
    exit 0
fi

print_info "Starting rollback process..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    print_info "Install with: pip install awscli"
    exit 1
fi

# Set cluster name based on environment
CLUSTER="shopmaster-$ENVIRONMENT"

print_info "Rolling back backend service..."
aws ecs update-service \
    --cluster $CLUSTER \
    --service backend \
    --force-new-deployment \
    --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"

if [ $? -eq 0 ]; then
    print_success "Backend rollback initiated"
else
    print_error "Backend rollback failed"
    exit 1
fi

print_info "Rolling back frontend service..."
aws ecs update-service \
    --cluster $CLUSTER \
    --service frontend \
    --force-new-deployment \
    --deployment-configuration "maximumPercent=200,minimumHealthyPercent=100"

if [ $? -eq 0 ]; then
    print_success "Frontend rollback initiated"
else
    print_error "Frontend rollback failed"
    exit 1
fi

print_info "Waiting for services to stabilize..."
aws ecs wait services-stable \
    --cluster $CLUSTER \
    --services backend frontend

if [ $? -eq 0 ]; then
    print_success "Services are stable"
else
    print_error "Services failed to stabilize"
    exit 1
fi

# Run health checks
print_info "Running health checks..."

if [ "$ENVIRONMENT" = "staging" ]; then
    BACKEND_URL="https://api-staging.yourdomain.com"
    FRONTEND_URL="https://staging.yourdomain.com"
else
    BACKEND_URL="https://api.yourdomain.com"
    FRONTEND_URL="https://yourdomain.com"
fi

# Check backend health
if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
    exit 1
fi

# Check frontend health
if curl -f "$FRONTEND_URL/health" > /dev/null 2>&1; then
    print_success "Frontend health check passed"
else
    print_error "Frontend health check failed"
    exit 1
fi

print_success "Rollback completed successfully!"
print_info "Please monitor the application for any issues"
print_info "Check logs: aws logs tail /aws/ecs/$CLUSTER --follow"
