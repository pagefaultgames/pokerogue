# Infrastructure and Deployment

## Deployment Strategy

**Strategy:** Direct Local-to-Mainnet Deployment
**CI/CD Platform:** GitHub Actions
**Pipeline Configuration:** `.github/workflows/`

## Environment Configuration

### Local Development Environment

```bash
# Setup local AO development using aos-local
aos-local init --config .ao/local-config.json
aos-local start --port 8080 &
aos deploy --source ao-processes/main.lua --local
```

### Production Environment (AO Mainnet)

```bash
# Deploy to AO network
ao deploy \
    --source dist/pokerogue-ao-process.lua \
    --config .ao/process-config.json \
    --wallet $AO_WALLET_KEY \
    --network mainnet
```

## Environment Promotion Flow

```
Local Development (aos-local) → Automated Testing (GitHub Actions) → Production Deploy (AO Mainnet)
```

## Rollback Strategy

**Primary Method:** AO Process Versioning with Immediate Revert
**Recovery Time Objective:** <5 minutes

```bash
# Rollback to previous version
ao deploy \
    --source "backups/${PREVIOUS_VERSION}/process.lua" \
    --wallet $AO_WALLET_KEY \
    --network mainnet
```