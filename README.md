# Add to Release Notes

![Release version][badge_release_version]
[![Build Status][badge_build]][link_build]
[![License][badge_license]][link_license]

This action allows you to add content to GitHub release notes programmatically. It can be run on any OS supported
by GitHub Actions.

Perfect for automatically appending build artifacts info, Docker image tags, deployment details, or any other
dynamic content to your release notes after release creation.

## Usage

```yaml
on:
  release:
    types: [published]

jobs:
  update-release:
    runs-on: ubuntu-latest
    steps:
      - name: Add Docker tags to release notes
        uses: gacts/add-to-release-notes@v1
        with:
          append: |
            ## 🐋 Docker images

            ```
            ghcr.io/user/repo:v1.2.3
            ghcr.io/user/repo:latest
            ```

      - name: Prepend important notice
        uses: gacts/add-to-release-notes@v1
        with:
          prepend: |
            > **Warning**
            > This release requires migration steps. See [MIGRATION.md](./MIGRATION.md)
```

## Customizing

### Inputs

The following inputs can be used as `step.with` keys:

| Name               |   Type   |             Default              | Required | Description                                                                            |
|--------------------|:--------:|:--------------------------------:|:--------:|----------------------------------------------------------------------------------------|
| `append`           | `string` |                                  |    no    | Content to append (at the end) to the release notes                                    |
| `prepend`          | `string` |                                  |    no    | Content to prepend (at the beginning) to the release notes                             |
| `skip-if-contains` | `string` |                                  |    no    | If the release notes already contain this string/regex, do not modify them             |
| `release-id`       | `string` | `${{ github.event.release.id }}` |    no    | Release ID to update. If not specified, will try to detect from context                |
| `tag-name`         | `string` |     `${{ github.ref_name }}`     |    no    | Tag name to find release. Used if release-id is not provided                           |
| `github-token`     | `string` |      `${{ github.token }}`       |    no    | GitHub auth token. Since there's a default, this is typically not supplied by the user |

### Outputs

| Name           |   Type   | Description                                       |
|----------------|:--------:|---------------------------------------------------|
| `updated-body` | `string` | The updated body content with added release notes |

## Examples

### Append Docker image tags after build

```yaml
name: Release

on:
  release:
    types: [published]

jobs:
  docker-build:
    runs-on: ubuntu-latest
    outputs:
      tags: ${{ steps.tags.outputs.list }}
    steps:
      - uses: actions/checkout@v5
      - {uses: gacts/github-slug@v1, id: slug}
      - uses: docker/login-action@v3
        with: {registry: ghcr.io, username: '${{ github.actor }}', password: '${{ secrets.GITHUB_TOKEN }}'}
      - id: tags
        env:
          GHCR_IMAGE: ghcr.io/${{ github.repository }}
          EXACT: ${{ steps.slug.outputs.version-semantic }}
          MINOR: ${{ steps.slug.outputs.version-major }}.${{ steps.slug.outputs.version-minor }}
          MAJOR: ${{ steps.slug.outputs.version-major }}
        run: |
          echo 'list<<EOF' >> $GITHUB_OUTPUT
          echo "$GHCR_IMAGE:$EXACT" >> "$GITHUB_OUTPUT"
          echo "$GHCR_IMAGE:$MINOR" >> "$GITHUB_OUTPUT"
          echo "$GHCR_IMAGE:$MAJOR" >> "$GITHUB_OUTPUT"
          echo "$GHCR_IMAGE:latest" >> "$GITHUB_OUTPUT"
          echo 'EOF' >> $GITHUB_OUTPUT
      - uses: docker/build-push-action@v6
        id: push
        with:
          context: .
          file: Dockerfile
          push: true
          tags: ${{ steps.tags.outputs.list }}

  update-release:
    runs-on: ubuntu-latest
    needs: [docker-build]
    steps:
      - uses: gacts/add-to-release-notes@v1
        with:
          append: |
            ## 🐋 Docker images

            ```
            ${{ needs.docker-build.outputs.tags }}
            ```
          skip-if-contains: "## 🐋 Docker images"
```

### Prepend and append content

```yaml
- uses: gacts/add-to-release-notes@v1
  with:
    prepend: |
      > **Note**
      > Breaking changes in this release!
    append: |
      ## 📦 Assets

      - `app-linux-amd64`
      - `app-darwin-arm64`
```

### Skip update if content already exists

```yaml
- uses: gacts/add-to-release-notes@v1
  with:
    append: |
      ## Deployment info
      Deployed to production at ${{ github.event.release.created_at }}
    skip-if-contains: "Deployment info"
```

### Using regex pattern for skip condition

```yaml
- uses: gacts/add-to-release-notes@v1
  with:
    append: "## Build #${{ github.run_number }}"
    skip-if-contains: '## Build #\d+'
```

### Update specific release by tag

```yaml
- uses: gacts/add-to-release-notes@v1
  with:
    tag-name: v1.2.3
    append: |
      ## Hotfix applied
      Security patch included
```

### Update specific release by ID

```yaml
- uses: gacts/add-to-release-notes@v1
  with:
    release-id: 123456789
    prepend: "⚠️ **Deprecated:** This release is no longer supported"
```

## Releasing

To release a new version:

- Build the action distribution (`make build` or `npm run build`).
- Commit and push changes (including `dist` directory changes - this is important) to the `master|main` branch.
- Publish the new release using the repo releases page (the git tag should follow the `vX.Y.Z` format).

Major and minor git tags (`v1` and `v1.2` if you publish a `v1.2.Z` release) will be updated automatically.

> [!TIP]
> Use [Dependabot](https://bit.ly/45zwLL1) to keep this action updated in your repository.

## Support

[![Issues][badge_issues]][link_issues]
[![Pull Requests][badge_pulls]][link_pulls]

If you find any errors in the action, please [create an issue][link_create_issue] in this repository.

## License

This is open-source software licensed under the [MIT License][link_license].

[badge_build]:https://img.shields.io/github/actions/workflow/status/gacts/add-to-release-notes/tests.yml?branch=master&maxAge=30
[badge_release_version]:https://img.shields.io/github/release/gacts/add-to-release-notes.svg?maxAge=30
[badge_license]:https://img.shields.io/github/license/gacts/add-to-release-notes.svg?longCache=true
[badge_release_date]:https://img.shields.io/github/release-date/gacts/add-to-release-notes.svg?maxAge=180
[badge_commits_since_release]:https://img.shields.io/github/commits-since/gacts/add-to-release-notes/latest.svg?maxAge=45
[badge_issues]:https://img.shields.io/github/issues/gacts/add-to-release-notes.svg?maxAge=45
[badge_pulls]:https://img.shields.io/github/issues-pr/gacts/add-to-release-notes.svg?maxAge=45

[link_build]:https://github.com/gacts/add-to-release-notes/actions
[link_license]:https://github.com/gacts/add-to-release-notes/blob/master/LICENSE
[link_issues]:https://github.com/gacts/add-to-release-notes/issues
[link_create_issue]:https://github.com/gacts/add-to-release-notes/issues/new
[link_pulls]:https://github.com/gacts/add-to-release-notes/pulls
