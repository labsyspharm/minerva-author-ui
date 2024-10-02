NODE_VERSION=$(node -p -e "require('./package.json').version")
pnpm build
git commit -am "$NODE_VERSION"
git tag "$NODE_VERSION" -m "$NODE_VERSION"
git push origin 2.0 --tags
pnpm publish --tag next
