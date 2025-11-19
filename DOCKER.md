# Docker Deployment Guide

This guide explains how to run the ShopMaster E-commerce platform using Docker.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## Quick Start

### Development Environment

1. **Clone the repository and navigate to the project directory**

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and fill in your configuration values (Stripe keys, email credentials, etc.)

3. **Start all services**
   ```bash
   docker-compose up -d
   ```

4. **View logs**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017
   - Redis: localhost:6379

6. **Stop all services**
   ```bash
   docker-compose down
   ```

7. **Stop and remove volumes (clean slate)**
   ```bash
   docker-compose down -v
   ```

## Service Architecture

The docker-compose setup includes:

- **MongoDB**: Database server (port 27017)
- **Redis**: Cache and session store (port 6379)
- **Backend**: Node.js API server (port 5000)
- **Frontend**: React application served by Nginx (port 3000)

## Building Individual Images

### Backend
```bash
docker build -t shopmaster-backend .
```

### Frontend
```bash
docker build -t shopmaster-frontend ./client
```

## Running Individual Containers

### Backend
```bash
docker run -d \
  --name shopmaster-backend \
  -p 5000:5000 \
  --env-file .env \
  shopmaster-backend
```

### Frontend
```bash
docker run -d \
  --name shopmaster-frontend \
  -p 3000:80 \
  shopmaster-frontend
```

## Health Checks

All services include health checks:

- **Backend**: `http://localhost:5000/health`
- **Frontend**: `http://localhost:3000/health`
- **MongoDB**: Internal mongosh ping
- **Redis**: redis-cli ping

Check service health:
```bash
docker-compose ps
```

## Volumes

Persistent data is stored in Docker volumes:

- `mongodb_data`: MongoDB database files
- `mongodb_config`: MongoDB configuration
- `redis_data`: Redis persistence
- `backend_logs`: Application logs

## Development Workflow

### Hot Reload

The docker-compose.yml mounts source directories for hot reload:
- Backend: `./src` and `./server.js` are mounted
- Frontend: Rebuild required for changes

### Rebuild After Changes

```bash
# Rebuild specific service
docker-compose up -d --build backend

# Rebuild all services
docker-compose up -d --build
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# Run npm commands
docker-compose exec backend npm test

# MongoDB shell
docker-compose exec mongodb mongosh -u admin -p admin123
```

## Production Deployment

For production, you should:

1. **Use production Dockerfile** (already optimized with multi-stage builds)

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   ```

3. **Use secrets management** (AWS Secrets Manager, HashiCorp Vault, etc.)

4. **Configure external databases** instead of containerized ones

5. **Use orchestration** (Kubernetes, Docker Swarm, ECS)

6. **Setup load balancer** in front of backend/frontend

7. **Configure SSL/TLS certificates**

8. **Setup monitoring and logging** (Prometheus, Grafana, ELK stack)

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs backend

# Check container status
docker-compose ps
```

### Database connection issues
```bash
# Verify MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Test connection
docker-compose exec backend node -e "require('./src/config/db').connectDB()"
```

### Port conflicts
If ports are already in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "5001:5000"  # Change host port
```

### Clean rebuild
```bash
# Remove all containers, volumes, and images
docker-compose down -v --rmi all

# Rebuild from scratch
docker-compose up -d --build
```

## Security Notes

- Default MongoDB credentials are for development only
- Change all secrets in production
- Use Docker secrets or environment variable injection
- Never commit `.env` files to version control
- Run containers as non-root users (already configured)
- Keep base images updated

## Resource Limits

For production, add resource limits to docker-compose.yml:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Monitoring

Monitor container resources:
```bash
# Real-time stats
docker stats

# Specific container
docker stats shopmaster-backend
```

## Backup and Restore

### Backup MongoDB
```bash
docker-compose exec mongodb mongodump \
  --username admin \
  --password admin123 \
  --authenticationDatabase admin \
  --out /data/backup
```

### Restore MongoDB
```bash
docker-compose exec mongodb mongorestore \
  --username admin \
  --password admin123 \
  --authenticationDatabase admin \
  /data/backup
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
