#!/bin/bash

# ShopMaster Deployment Script
# This script helps with manual deployments

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
    echo "Usage: ./scripts/deploy.sh [development|staging|production]"
    exit 1
fi

ENVIRONMENT=$1

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    echo "Valid environments: development, staging, production"
    exit 1
fi

print_info "Starting deployment to $ENVIRONMENT environment..."

# Check if .env file exists
if [ ! -f ".env.$ENVIRONMENT" ]; then
    print_error ".env.$ENVIRONMENT file not found"
    exit 1
fi

# Copy environment file
print_info "Loading environment configuration..."
cp ".env.$ENVIRONMENT" .env
print_success "Environment configuration loaded"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running"
    exit 1
fi
print_success "Docker is running"

# Build backend image
print_info "Building backend Docker image..."
docker build -t shopmaster-backend:$ENVIRONMENT .
if [ $? -eq 0 ]; then
    print_success "Backend image built successfully"
else
    print_error "Backend image build failed"
    exit 1
fi

# Build frontend image
print_info "Building frontend Docker image..."
docker build -t shopmaster-frontend:$ENVIRONMENT ./client
if [ $? -eq 0 ]; then
    print_success "Frontend image built successfully"
else
    print_error "Frontend image build failed"
    exit 1
fi

# For development, use docker-compose
if [ "$ENVIRONMENT" = "development" ]; then
    print_info "Starting services with docker-compose..."
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_success "Services started successfully"
        print_info "Backend: http://localhost:5000"
        print_info "Frontend: http://localhost:3000"
        print_info "MongoDB: localhost:27017"
        print_info "Redis: localhost:6379"
    else
        print_error "Failed to start services"
        exit 1
    fi
    
    # Show logs
    print_info "Showing logs (Ctrl+C to exit)..."
    docker-compose logs -f
    
    exit 0
fi

# For staging/production, push to registry
print_warning "For staging/production deployments, images need to be pushed to a registry"
print_info "Next steps:"
echo "1. Tag images for your registry:"
echo "   docker tag shopmaster-backend:$ENVIRONMENT your-registry/shopmaster-backend:$ENVIRONMENT"
echo "   docker tag shopmaster-frontend:$ENVIRONMENT your-registry/shopmaster-frontend:$ENVIRONMENT"
echo ""
echo "2. Push images to registry:"
echo "   docker push your-registry/shopmaster-backend:$ENVIRONMENT"
echo "   docker push your-registry/shopmaster-frontend:$ENVIRONMENT"
echo ""
echo "3. Deploy to your infrastructure (AWS ECS, Kubernetes, etc.)"
echo ""
print_info "Or use the CI/CD pipeline for automated deployments"
