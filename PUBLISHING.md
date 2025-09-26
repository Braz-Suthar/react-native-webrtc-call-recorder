# Publishing Guide

This document provides step-by-step instructions for publishing the `react-native-webrtc-call-recorder` package to npm.

## Pre-publish Checklist

### 1. Code Quality
- [ ] All tests pass (`npm test`)
- [ ] Code builds successfully (`npm run build`)
- [ ] No linting errors (`npm run lint`)
- [ ] TypeScript compilation successful
- [ ] Example app works on both Android and iOS

### 2. Documentation
- [ ] README.md is complete and accurate
- [ ] CHANGELOG.md is updated with latest changes
- [ ] CONTRIBUTING.md is present
- [ ] API documentation is complete
- [ ] Installation instructions are clear

### 3. Package Configuration
- [ ] `package.json` has correct name, version, and description
- [ ] All dependencies are properly specified
- [ ] `files` field includes all necessary files
- [ ] `.npmignore` excludes unnecessary files
- [ ] License is properly specified

### 4. Native Code
- [ ] Android module compiles without errors
- [ ] iOS module compiles without errors
- [ ] Expo config plugin works correctly
- [ ] All native dependencies are properly declared

## Publishing Steps

### 1. Version Management

Update the version in `package.json`:

```bash
# For patch releases (bug fixes)
npm version patch

# For minor releases (new features)
npm version minor

# For major releases (breaking changes)
npm version major
```

### 2. Build and Test

```bash
# Clean previous builds
npm run clean

# Build the package
npm run build

# Run all tests
npm test

# Verify the build output
ls -la lib/
```

### 3. Pre-publish Validation

```bash
# Check what files will be included
npm pack --dry-run

# Test the package locally
npm pack
tar -tzf react-native-webrtc-call-recorder-1.0.0.tgz
```

### 4. Publish to npm

```bash
# Login to npm (if not already logged in)
npm login

# Publish the package
npm publish

# Verify publication
npm view react-native-webrtc-call-recorder
```

### 5. Post-publish Tasks

1. **Create GitHub Release**
   - Go to GitHub repository
   - Create a new release
   - Tag the release with the version number
   - Include changelog in release notes

2. **Update Documentation**
   - Update any version-specific documentation
   - Update example apps if needed
   - Notify users of breaking changes

3. **Test Installation**
   - Test installation in a fresh project
   - Verify both React Native and Expo workflows
   - Test on both Android and iOS

## Rollback Procedure

If issues are discovered after publishing:

### 1. Deprecate Version
```bash
npm deprecate react-native-webrtc-call-recorder@1.0.0 "This version has critical issues"
```

### 2. Publish Fix
```bash
# Fix the issues
# Update version
npm version patch

# Publish fixed version
npm publish
```

### 3. Notify Users
- Update GitHub issues
- Post in relevant communities
- Update documentation

## Version Strategy

### Semantic Versioning
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features (backward compatible)
- **PATCH** (1.0.0 → 1.0.1): Bug fixes (backward compatible)

### Release Types

#### Patch Release (1.0.0 → 1.0.1)
- Bug fixes
- Documentation updates
- No API changes
- No breaking changes

#### Minor Release (1.0.0 → 1.1.0)
- New features
- New API methods
- Backward compatible
- No breaking changes

#### Major Release (1.0.0 → 2.0.0)
- Breaking changes
- API changes
- Requires migration guide
- Extensive testing required

## Quality Assurance

### Automated Checks
- [ ] CI/CD pipeline passes
- [ ] All tests pass
- [ ] Code coverage maintained
- [ ] Security scan passes

### Manual Testing
- [ ] Test on Android device
- [ ] Test on iOS device
- [ ] Test with Expo prebuild
- [ ] Test with React Native bare workflow
- [ ] Test error scenarios
- [ ] Test permission handling

### Documentation Review
- [ ] Installation instructions work
- [ ] API documentation is accurate
- [ ] Examples run successfully
- [ ] Troubleshooting section is helpful

## Release Notes Template

```markdown
## [1.0.0] - 2024-01-XX

### Added
- Initial release
- Android and iOS support
- Expo config plugin
- TypeScript definitions

### Features
- Record WebRTC calls locally
- Mix local and remote audio
- Support for WAV and AAC formats
- Manual track registration

### Breaking Changes
- None (initial release)

### Migration Guide
- N/A (initial release)
```

## Troubleshooting

### Common Issues

1. **"Package already exists"**
   - Check if version already published
   - Use `npm view` to check existing versions
   - Increment version number

2. **"Permission denied"**
   - Check npm login status
   - Verify package ownership
   - Check npm permissions

3. **"Build failed"**
   - Check TypeScript compilation
   - Verify all dependencies installed
   - Check for syntax errors

4. **"Files missing"**
   - Check `.npmignore` file
   - Verify `files` field in `package.json`
   - Ensure build output is correct

### Support

For publishing issues:
- Check npm documentation
- Contact npm support
- Check GitHub issues
- Review package configuration

## Security Considerations

- Never publish with hardcoded secrets
- Use `.npmignore` to exclude sensitive files
- Review all dependencies for vulnerabilities
- Keep dependencies updated
- Use `npm audit` to check for issues

## Best Practices

1. **Always test before publishing**
2. **Use semantic versioning**
3. **Keep changelog updated**
4. **Document breaking changes**
5. **Provide migration guides**
6. **Test on multiple platforms**
7. **Keep dependencies updated**
8. **Use automated testing**
