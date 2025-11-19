# Deployment Scripts

This directory contains scripts for deploying and managing the ShopMaster application.

## Scripts

### deploy.sh

Automated deployment script for different environments.

**Usage:**
```bash
./scripts/deploy.sh [environment]
```

**Environments:**
- `development` - Local development with docker-compose
- `staging` - Staging environment
- `production` - Production environment

**Examples:**
```bash
# Deploy to local development
./scripts/deploy.sh development

# Build images for staging
./scripts/deploy.sh staging

# Build images for production
./scripts/deploy.sh production
```

**What it does:**
1. Validates environment
2. Loads environment configuration
3. Builds Docker images
4. For development: Starts services with docker-compose
5. For staging/production: Provides instructions for registry push

### rollback.sh

Rollback script for reverting deployments.

**Usage:**
```bash
./scripts/rollback.sh [environment] [version]
```

**Environments:**
- `staging` - Rollback staging environment
- `production` - Rollback production environment

**Examples:**
```bash
# Rollback staging to previous version
./scripts/rollback.sh staging

# Rollback production to specific version
./scripts/rollback.sh production v1.2.3
```

**What it does:**
1. Confirms rollback action
2. Updates ECS services to previous version
3. Waits for services to stabilize
4. Runs health checks
5. Reports status

## Prerequisites

### For deploy.sh
- Docker installed and running
- Environment configuration files (.env.development, .env.staging, .env.production)
- For staging/production: Access to container registry

### For rollback.sh
- AWS CLI installed and configured
- AWS credentials with ECS permissions
- Access to target environment

## Making Scripts Executable

**Linux/Mac:**
```bash
chmod +x scripts/deploy.sh
chmod +x scripts/rollback.sh
```

**Windows (Git Bash):**
```bash
git update-index --chmod=+x scripts/deploy.sh
git update-index --chmod=+x scripts/rollback.sh
```

## Environment Configuration

Before running deployment scripts, ensure you have the appropriate environment file:

```bash
# Check if environment file exists
ls -la .env.development
ls -la .env.staging
ls -la .env.production
```

If missing, copy from example:
```bash
cp .env.example .env.development
# Edit .env.development with your values
```

## AWS Configuration

For staging/production deployments and rollbacks, configure AWS CLI:

```bash
# Configure AWS credentials
aws configure

# Test AWS access
aws sts get-caller-identity
```

## Docker Registry

For staging/production, you need to push images to a registry:

**AWS ECR:**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com

# Tag images
docker tag shopmaster-backend:staging YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/shopmaster-backend:staging
docker tag shopmaster-frontend:staging YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/shopmaster-frontend:staging

# Push images
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/shopmaster-backend:staging
docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/shopmaster-frontend:staging
```

**Docker Hub:**
```bash
# Login to Docker Hub
docker login

# Tag images
docker tag shopmaster-backend:staging yourusername/shopmaster-backend:staging
docker tag shopmaster-frontend:staging yourusername/shopmaster-frontend:staging

# Push images
docker push yourusername/shopmaster-backend:staging
docker push yourusername/shopmaster-frontend:staging
```

## Troubleshooting

### Script Permission Denied

**Error:** `Permission denied: ./scripts/deploy.sh`

**Solution:**
```bash
chmod +x scripts/deploy.sh
```

### Docker Not Running

**Error:** `Docker is not running`

**Solution:**
```bash
# Start Docker Desktop (Windows/Mac)
# Or start Docker daemon (Linux)
sudo systemctl start docker
```

### AWS CLI Not Found

**Error:** `AWS CLI is not installed`

**Solution:**
```bash
# Install AWS CLI
pip install awscli

# Or use package manager
# Mac: brew install awscli
# Ubuntu: sudo apt install awscli
```

### Environment File Not Found

**Error:** `.env.staging file not found`

**Solution:**
```bash
# Copy from example
cp .env.example .env.staging

# Edit with your values
nano .env.staging
```

### Health Check Failed

**Error:** `Backend health check failed`

**Solution:**
1. Check if services are running
2. Verify URLs are correct
3. Check firewall/security groups
4. Review application logs

## Best Practices

1. **Always test in staging first**
   ```bash
   ./scripts/deploy.sh staging
   # Test thoroughly
   ./scripts/deploy.sh production
   ```

2. **Keep rollback ready**
   - Know the previous working version
   - Have rollback script tested
   - Monitor after deployment

3. **Use CI/CD for production**
   - Manual scripts are for emergencies
   - CI/CD provides better tracking
   - Automated testing included

4. **Monitor after deployment**
   ```bash
   # Check logs
   docker-compose logs -f  # Development
   aws logs tail /aws/ecs/shopmaster-production --follow  # Production
   ```

5. **Document deployments**
   - Note version deployed
   - Record any issues
   - Update team

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [AWS CLI Documentation](https://docs.aws.amazon.com/cli/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Main Deployment Guide](../DOCKER.md)
- [CI/CD Documentation](../CICD.md)
