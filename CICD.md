# CI/CD Pipeline Documentation

This document explains the Continuous Integration and Continuous Deployment (CI/CD) setup for the ShopMaster E-commerce platform.

## Table of Contents

- [Overview](#overview)
- [GitHub Actions](#github-actions)
- [GitLab CI](#gitlab-ci)
- [Pipeline Stages](#pipeline-stages)
- [Environment Setup](#environment-setup)
- [Deployment Strategies](#deployment-strategies)
- [Rollback Procedures](#rollback-procedures)
- [Monitoring and Alerts](#monitoring-and-alerts)

## Overview

The project includes CI/CD configurations for both GitHub Actions and GitLab CI. Choose the one that matches your Git hosting platform.

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Code Push/PR                             │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                   CI Pipeline                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Lint    │  │  Test    │  │  Build   │  │ Security │   │
│  │  Code    │→ │  Code    │→ │  Images  │→ │  Scan    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│                   CD Pipeline                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Deploy  │→ │  Smoke   │→ │  Health  │→ │  Notify  │   │
│  │  Images  │  │  Tests   │  │  Check   │  │  Team    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## GitHub Actions

### Workflows

The project includes three GitHub Actions workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on: Push to main/develop, Pull Requests
   - Tests backend and frontend
   - Builds Docker images
   - Runs security scans

2. **CD Staging** (`.github/workflows/cd-staging.yml`)
   - Runs on: Push to develop branch
   - Deploys to staging environment
   - Runs smoke tests

3. **CD Production** (`.github/workflows/cd-production.yml`)
   - Runs on: Push to main branch or version tags
   - Deploys to production environment
   - Includes rollback capability

### Required Secrets

Configure these secrets in GitHub repository settings:

#### AWS Deployment
```
AWS_ACCESS_KEY_ID          # AWS access key
AWS_SECRET_ACCESS_KEY      # AWS secret key
AWS_REGION                 # AWS region (e.g., us-east-1)
```

#### Application Secrets
```
REACT_APP_API_URL                  # Backend API URL
REACT_APP_SOCKET_URL               # WebSocket server URL
REACT_APP_STRIPE_PUBLISHABLE_KEY   # Stripe publishable key
```

#### Notifications
```
SLACK_WEBHOOK_URL          # Slack webhook for notifications
```

#### Optional
```
CODECOV_TOKEN              # Codecov token for coverage reports
```

### Workflow Triggers

**CI Pipeline:**
```yaml
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
```

**CD Staging:**
```yaml
on:
  push:
    branches: [ develop ]
  workflow_dispatch:  # Manual trigger
```

**CD Production:**
```yaml
on:
  push:
    branches: [ main ]
    tags:
      - 'v*.*.*'
  workflow_dispatch:  # Manual trigger
```

## GitLab CI

### Pipeline Configuration

The `.gitlab-ci.yml` file defines a three-stage pipeline:

1. **Test Stage**
   - Backend tests
   - Frontend tests
   - Security scanning

2. **Build Stage**
   - Build backend Docker image
   - Build frontend Docker image

3. **Deploy Stage**
   - Deploy to staging (automatic on develop)
   - Deploy to production (manual on main)
   - Rollback production (manual)

### Required Variables

Configure these variables in GitLab CI/CD settings:

#### Registry
```
CI_REGISTRY_USER           # GitLab registry username
CI_REGISTRY_PASSWORD       # GitLab registry password
CI_REGISTRY                # GitLab registry URL
CI_REGISTRY_IMAGE          # Image repository path
```

#### Deployment
```
STAGING_DEPLOY_WEBHOOK_URL     # Webhook to trigger staging deployment
PRODUCTION_DEPLOY_WEBHOOK_URL  # Webhook to trigger production deployment
PRODUCTION_ROLLBACK_WEBHOOK_URL # Webhook to trigger rollback
```

### Pipeline Triggers

- **Test & Build**: Runs on all commits
- **Deploy Staging**: Automatic on develop branch
- **Deploy Production**: Manual approval required on main branch
- **Rollback**: Manual trigger only

## Pipeline Stages

### 1. Linting

**Purpose:** Ensure code quality and consistency

**Backend:**
```bash
npm run lint
```

**Frontend:**
```bash
cd client && npm run lint
```

**Configuration:**
- ESLint for JavaScript/React
- Prettier for code formatting

### 2. Testing

**Purpose:** Verify code functionality

**Backend Tests:**
- Unit tests with Jest
- Integration tests with Supertest
- Property-based tests with fast-check
- Requires MongoDB and Redis services

**Frontend Tests:**
- Component tests with React Testing Library
- Unit tests with Jest
- Coverage reporting

**Test Commands:**
```bash
# Backend
npm test
npm run test:coverage

# Frontend
cd client && npm test -- --watchAll=false --coverage
```

### 3. Building

**Purpose:** Create deployable artifacts

**Backend:**
```bash
docker build -t shopmaster-backend:$VERSION .
```

**Frontend:**
```bash
docker build -t shopmaster-frontend:$VERSION ./client
```

**Artifacts:**
- Docker images pushed to registry
- Tagged with commit SHA and 'latest'

### 4. Security Scanning

**Purpose:** Identify vulnerabilities

**Tools:**
- Trivy for container scanning
- npm audit for dependency vulnerabilities

**Commands:**
```bash
# Trivy scan
trivy fs --severity CRITICAL,HIGH .

# npm audit
npm audit --audit-level=moderate
```

### 5. Deployment

**Purpose:** Deploy to target environment

**Staging:**
- Automatic on develop branch
- Uses test/staging credentials
- Runs smoke tests

**Production:**
- Manual approval required
- Uses production credentials
- Blue/Green deployment strategy
- Includes rollback capability

## Environment Setup

### GitHub Actions Environments

1. **Create environments:**
   - Go to Settings → Environments
   - Create "staging" and "production" environments

2. **Configure protection rules:**
   - Production: Require reviewers
   - Production: Wait timer (optional)

3. **Add environment secrets:**
   - Environment-specific variables
   - Override repository secrets if needed

### GitLab CI Environments

1. **Configure in `.gitlab-ci.yml`:**
   ```yaml
   environment:
     name: production
     url: https://yourdomain.com
   ```

2. **Set up protected environments:**
   - Go to Settings → CI/CD → Protected Environments
   - Restrict who can deploy

## Deployment Strategies

### Blue/Green Deployment

**Used in:** Production deployments

**Process:**
1. Deploy new version alongside old version
2. Run health checks on new version
3. Switch traffic to new version
4. Keep old version for quick rollback

**Configuration:**
```yaml
deployment-configuration:
  maximumPercent: 200
  minimumHealthyPercent: 100
```

### Rolling Deployment

**Used in:** Staging deployments

**Process:**
1. Deploy to subset of instances
2. Verify health
3. Continue to remaining instances

### Canary Deployment

**Optional:** For gradual production rollout

**Process:**
1. Deploy to small percentage of users
2. Monitor metrics
3. Gradually increase percentage
4. Rollback if issues detected

## Rollback Procedures

### Automatic Rollback

Triggers on:
- Failed health checks
- Failed smoke tests
- Deployment timeout

### Manual Rollback

**GitHub Actions:**
```bash
# Trigger rollback workflow
gh workflow run cd-production.yml -f rollback=true
```

**GitLab CI:**
```bash
# Trigger manual rollback job
# Available in GitLab UI
```

**AWS ECS:**
```bash
# Rollback to previous task definition
aws ecs update-service \
  --cluster shopmaster-production \
  --service backend \
  --task-definition shopmaster-backend:PREVIOUS_VERSION
```

### Rollback Checklist

- [ ] Identify issue and version to rollback to
- [ ] Notify team of rollback
- [ ] Execute rollback procedure
- [ ] Verify application health
- [ ] Check database migrations (may need manual intervention)
- [ ] Monitor error rates
- [ ] Document incident

## Monitoring and Alerts

### Health Checks

**Endpoints:**
- Backend: `https://api.yourdomain.com/health`
- Frontend: `https://yourdomain.com/health`

**Checks:**
- HTTP 200 response
- Response time < 3 seconds
- Database connectivity
- Redis connectivity

### Smoke Tests

**Post-deployment tests:**
```bash
# Health check
curl -f https://api.yourdomain.com/health

# API endpoint test
curl -f https://api.yourdomain.com/api/products

# Frontend test
curl -f https://yourdomain.com
```

### Notifications

**Slack Integration:**
- Deployment started
- Deployment successful
- Deployment failed
- Rollback triggered

**Email Notifications:**
- Configure in GitHub/GitLab settings
- Send to team distribution list

### Monitoring Tools

**Recommended:**
- Sentry for error tracking
- Datadog/New Relic for APM
- CloudWatch for AWS metrics
- Grafana for custom dashboards

## Best Practices

### 1. Branch Strategy

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (development)
```

### 2. Commit Messages

Follow conventional commits:
```
feat: add user authentication
fix: resolve payment processing bug
docs: update deployment guide
test: add unit tests for cart service
```

### 3. Version Tagging

Use semantic versioning:
```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 4. Testing Before Merge

- All tests must pass
- Code review required
- No merge conflicts
- Branch up to date with target

### 5. Deployment Windows

**Production:**
- Deploy during low-traffic hours
- Avoid Fridays and holidays
- Have team available for monitoring

**Staging:**
- Deploy anytime
- Test thoroughly before production

### 6. Database Migrations

**Process:**
1. Run migrations before deployment
2. Ensure backward compatibility
3. Test rollback procedure
4. Document migration steps

### 7. Feature Flags

Use environment variables to toggle features:
```javascript
if (process.env.ENABLE_NEW_FEATURE === 'true') {
  // New feature code
}
```

## Troubleshooting

### Pipeline Failures

**Tests failing:**
1. Check test logs
2. Verify service dependencies (MongoDB, Redis)
3. Check environment variables
4. Run tests locally

**Build failing:**
1. Check Dockerfile syntax
2. Verify dependencies are installed
3. Check for missing files
4. Review build logs

**Deployment failing:**
1. Check AWS credentials
2. Verify ECS cluster status
3. Check Docker image availability
4. Review deployment logs

### Common Issues

**Issue:** Tests timeout
**Solution:** Increase timeout in test configuration

**Issue:** Docker build fails
**Solution:** Clear Docker cache and rebuild

**Issue:** Deployment stuck
**Solution:** Check ECS service events and task logs

**Issue:** Health check fails
**Solution:** Verify application is running and endpoints are accessible

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitLab CI Documentation](https://docs.gitlab.com/ee/ci/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [AWS ECS Deployment](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-types.html)
- [Semantic Versioning](https://semver.org/)
