# GitHub Actions Workflows

Complete CI/CD workflows for PACSUM ERP application.

## Workflows

### 1. **ci.yml** - Continuous Integration
- **Triggers:** Push to master/main/develop, Pull requests
- **Jobs:**
  - Test (Node 18.x, 20.x) - Linting, type checking, tests
  - Build - Production build
  - Security - npm audit
- **Artifacts:** Build output (.next)

### 2. **deploy-staging.yml** - Deploy to Staging
- **Triggers:** Push to develop, manual workflow dispatch
- **Jobs:**
  - Build and deploy to Vercel staging
- **Requires:** `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` secrets

### 3. **deploy-production.yml** - Deploy to Production
- **Triggers:** Push to master/main, manual workflow dispatch
- **Jobs:**
  - Build, test, and deploy to Vercel production
  - Health check verification
- **Requires:** `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` secrets

### 4. **code-quality.yml** - Code Quality Checks
- **Triggers:** Push/PR to master/main/develop
- **Jobs:**
  - ESLint
  - TypeScript type checking
  - Jest tests with coverage
  - SonarCloud (optional)
- **Requires:** `SONAR_TOKEN` (optional)

### 5. **release.yml** - Release Management
- **Triggers:** Push with version tag (v*.*.*)
- **Jobs:**
  - Run tests
  - Build application
  - Create GitHub Release
  - Deploy to production
- **Requires:** `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` secrets

### 6. **db-migration.yml** - Database Migrations
- **Triggers:** Changes to database/migrations/, manual dispatch
- **Jobs:**
  - Validate SQL migration files
  - Prepare for deployment
- **Requires:** `DATABASE_URL` (optional)

### 7. **security.yml** - Security Scanning
- **Triggers:** Push to master/main/develop, weekly schedule
- **Jobs:**
  - npm audit
  - Dependency check
- **No secrets required**

## Setting Up Workflows

### 1. Required Secrets
Add these to GitHub repository settings (Settings > Secrets and variables > Actions):

```
VERCEL_TOKEN         - Vercel authentication token
VERCEL_PROJECT_ID    - Vercel project ID
GITHUB_TOKEN         - Automatically provided by GitHub
SONAR_TOKEN          - SonarCloud token (optional)
DATABASE_URL         - Database connection string (optional)
```

### 2. Configure Branches
Update branch names in workflows if using different default branch:
- Change `master` to your main branch
- Change `main` to your main branch
- Change `develop` to your development branch

### 3. Configure Deployment
Update Vercel configuration in deployment workflows:
- Change `pacsum-erp` to your Vercel project name
- Update deployment URL in health checks
- Configure environment variables in Vercel

## Workflow Triggers

| Workflow | Push | PR | Schedule | Manual |
|----------|------|----|-----------:|--------|
| CI | ✅ | ✅ | - | - |
| Deploy Staging | ✅ (develop) | - | - | ✅ |
| Deploy Production | ✅ (main) | - | - | ✅ |
| Code Quality | ✅ | ✅ | - | - |
| Release | ✅ (tags) | - | - | - |
| DB Migration | ✅ | - | - | ✅ |
| Security | ✅ | - | ✅ (weekly) | - |

## Usage

### Manual Trigger
```bash
# Trigger staging deployment
gh workflow run deploy-staging.yml

# Trigger production deployment
gh workflow run deploy-production.yml

# Trigger database migration
gh workflow run db-migration.yml
```

### View Workflow Status
```bash
# List recent workflow runs
gh run list

# View specific workflow run
gh run view <run-id>

# Stream workflow logs
gh run watch <run-id>
```

## Troubleshooting

### Build Failures
1. Check workflow logs in GitHub Actions tab
2. Verify all secrets are set correctly
3. Ensure environment variables are configured
4. Check Node.js version compatibility

### Deployment Failures
1. Verify Vercel credentials
2. Check project settings in Vercel
3. Review deployment logs in Vercel dashboard
4. Verify database migrations completed

### Security Scan Failures
1. Review npm audit results
2. Update vulnerable dependencies
3. Accept advisories if necessary
4. Document security exceptions

## Best Practices

1. **Always run tests before deployment**
   - CI pipeline tests on all PRs
   - Production deployment includes test step

2. **Use environment-specific secrets**
   - Separate staging and production secrets
   - Limit secret scope to necessary workflows

3. **Monitor workflow performance**
   - Track build times
   - Identify slow test suites
   - Optimize workflow steps

4. **Keep workflows updated**
   - Regular dependency updates
   - Action version updates
   - Node.js version updates

5. **Review deployment logs**
   - Post-deployment verification
   - Health check monitoring
   - Error tracking

## Documentation

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Deployment](https://vercel.com/docs)
- [Node.js Actions](https://github.com/actions/setup-node)

---

**Created:** November 9, 2024
**Status:** Production Ready
**Last Updated:** November 9, 2024
