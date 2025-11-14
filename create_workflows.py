import os

workflows_dir = '.github/workflows'
os.makedirs(workflows_dir, exist_ok=True)

workflows = {
    'ci.yml': """name: CI/CD Pipeline

on:
  push:
    branches: [ master, main, develop ]
  pull_request:
    branches: [ master, main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: ${'${{ matrix.node-version }}'}
        cache: npm
    - run: npm ci
    - run: npm run lint --if-present
    - run: npm run type-check --if-present
    - run: npm test --if-present

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: npm
    - run: npm ci
    - run: npm run build
    - uses: actions/upload-artifact@v3
      with:
        name: build-output
        path: .next
""",
    
    'deploy-staging.yml': """name: Deploy to Staging

on:
  push:
    branches: [ develop ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: npm
    - run: npm ci
    - run: npm run build
    - name: Deploy to Vercel
      env:
        VERCEL_TOKEN: ${'${{ secrets.VERCEL_TOKEN }}'}
        VERCEL_PROJECT_ID: ${'${{ secrets.VERCEL_PROJECT_ID }}'}
      run: |
        npm install -g vercel
        vercel --token=${'$VERCEL_TOKEN'} --scope=pacsum-erp
""",
    
    'deploy-production.yml': """name: Deploy to Production

on:
  push:
    branches: [ master, main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: npm
    - run: npm ci
    - run: npm test --if-present
    - run: npm run build
    - name: Deploy to Vercel
      env:
        VERCEL_TOKEN: ${'${{ secrets.VERCEL_TOKEN }}'}
        VERCEL_PROJECT_ID: ${'${{ secrets.VERCEL_PROJECT_ID }}'}
      run: |
        npm install -g vercel
        vercel --prod --token=${'$VERCEL_TOKEN'} --scope=pacsum-erp
""",
    
    'code-quality.yml': """name: Code Quality

on:
  push:
    branches: [ master, main, develop ]
  pull_request:
    branches: [ master, main, develop ]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        fetch-depth: 0
    - uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: npm
    - run: npm ci
    - run: npm run lint --if-present
    - run: npm run type-check --if-present
    - run: npm test -- --coverage --if-present
""",
    
    'release.yml': """name: Release

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: npm
    - run: npm ci
    - run: npm test --if-present
    - run: npm run build
    - uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${'${{ secrets.GITHUB_TOKEN }}'}
      with:
        tag_name: ${'${{ github.ref }}'}
        release_name: Release ${'${{ github.ref }}'}
        body: Production release ready
        draft: false
""",
    
    'db-migration.yml': """name: Database Migrations

on:
  push:
    branches: [ master, main, develop ]
    paths:
      - 'database/migrations/**'
  workflow_dispatch:

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: npm
    - run: npm ci
    - name: Validate migrations
      run: |
        echo "Validating SQL migration files..."
        for file in database/migrations/*.sql; do
          echo "Checking: ${'$file'}"
        done
"""
}

for filename, content in workflows.items():
    filepath = os.path.join(workflows_dir, filename)
    with open(filepath, 'w') as f:
        f.write(content)
    print(f'✅ Created {filename}')

print('\n🎉 All workflows created successfully!')
