# Contributing to react-native-webrtc-call-recorder

Thank you for your interest in contributing to react-native-webrtc-call-recorder! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Publishing](#publishing)
- [Pull Request Process](#pull-request-process)

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/) code of conduct. By participating, you are expected to uphold this code.

## Getting Started

### Prerequisites

- Node.js (>= 16)
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development)
- Git

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/yourusername/react-native-webrtc-call-recorder.git
cd react-native-webrtc-call-recorder
```

3. Add the upstream remote:

```bash
git remote add upstream https://github.com/originalowner/react-native-webrtc-call-recorder.git
```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Build the Package

```bash
npm run build
```

### Run Tests

```bash
npm test
```

### Run Linting

```bash
npm run lint
```

### Example App

The example app demonstrates how to use the package:

```bash
cd example
npm install
```

#### Android

```bash
cd example
npx react-native run-android
```

#### iOS

```bash
cd example
cd ios && pod install && cd ..
npx react-native run-ios
```

## Making Changes

### Branch Naming

Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
# or
git checkout -b docs/your-documentation-update
```

### Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Add proper type definitions
- Include JSDoc comments for public APIs
- Follow React Native best practices

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add support for AAC encoding
fix: resolve Android permission issue
docs: update installation instructions
test: add unit tests for recording API
```

### File Structure

```
src/
├── index.ts              # Main TypeScript entry point
├── types.ts              # TypeScript type definitions
android/
├── build.gradle          # Android build configuration
├── src/main/java/...     # Android native implementation
ios/
├── WebrtcCallRecorder.h  # iOS header file
├── WebrtcCallRecorder.m  # iOS implementation
plugin/
├── index.ts              # Expo config plugin
example/
├── App.tsx               # Example React Native app
├── package.json          # Example app dependencies
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Requirements

- All new features must include tests
- Maintain or improve test coverage
- Test both success and error cases
- Include integration tests for native modules

### Manual Testing

1. Test on both Android and iOS devices
2. Test with different WebRTC configurations
3. Test permission scenarios
4. Test error handling and edge cases

## Publishing

### Version Management

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Pre-release Testing

Before publishing:

1. Run all tests: `npm test`
2. Build the package: `npm run build`
3. Test the example app
4. Verify TypeScript compilation
5. Check linting: `npm run lint`

### Publishing Steps

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create a release tag
4. Publish to npm

```bash
# Update version
npm version patch  # or minor, major

# Publish
npm publish
```

### Post-publish

1. Create GitHub release
2. Update documentation if needed
3. Notify users of breaking changes

## Pull Request Process

### Before Submitting

1. Ensure your code follows the project's style guidelines
2. Add tests for new functionality
3. Update documentation as needed
4. Run all tests and ensure they pass
5. Update `CHANGELOG.md` if applicable

### Pull Request Template

When creating a pull request, include:

- **Description**: What changes were made and why
- **Type**: Feature, Bug Fix, Documentation, etc.
- **Testing**: How the changes were tested
- **Breaking Changes**: Any breaking changes and migration steps
- **Related Issues**: Link to any related issues

### Review Process

1. All pull requests require review
2. Address reviewer feedback promptly
3. Keep pull requests focused and atomic
4. Update your branch if the main branch has moved forward

### Merge Requirements

- All tests must pass
- Code review approval
- No merge conflicts
- Documentation updated if needed

## Native Development

### Android (Kotlin)

- Follow Kotlin coding conventions
- Use coroutines for async operations
- Handle permissions properly
- Test on different Android versions

### iOS (Swift/Objective-C)

- Follow Apple's coding guidelines
- Use proper memory management
- Handle permissions and privacy
- Test on different iOS versions

### WebRTC Integration

- Use official WebRTC APIs
- Handle audio track lifecycle properly
- Implement proper error handling
- Test with different WebRTC configurations

## Documentation

### Code Documentation

- Add JSDoc comments for all public APIs
- Include usage examples
- Document any breaking changes
- Keep README.md up to date

### API Documentation

- Document all method parameters
- Include return types
- Provide usage examples
- Document error conditions

## Support

### Getting Help

- Check existing issues and discussions
- Create a new issue with detailed information
- Provide reproduction steps for bugs
- Include device and OS information

### Issue Templates

Use the provided issue templates for:
- Bug reports
- Feature requests
- Documentation improvements

## Release Process

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped
- [ ] Tagged and released
- [ ] Published to npm

### Release Notes

Include in release notes:
- New features
- Bug fixes
- Breaking changes
- Migration instructions
- Known issues

## License

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.

## Questions?

If you have questions about contributing, please:

1. Check the documentation
2. Search existing issues
3. Create a new issue with the "question" label
4. Contact the maintainers

Thank you for contributing to react-native-webrtc-call-recorder! 🎉
