import {getInput, info, setFailed, setOutput, warning} from '@actions/core'
import {context, getOctokit} from '@actions/github'

const input = {
  append: getInput('append'),
  prepend: getInput('prepend'),
  skipIfContains: getInput('skip-if-contains'),
  releaseId: getInput('release-id'),
  tagName: getInput('tag-name'),
  githubToken: getInput('github-token', {required: true}),
}

/**
 * Check if content matches the skip pattern (regex or string).
 *
 * @param {string} content - Content to check
 * @param {string} pattern - Pattern to match (regex or string)
 * @returns {boolean}
 */
function shouldSkip(content, pattern) {
  if (!pattern || !content) return false

  try {
    // Try to parse as regex
    const regex = new RegExp(pattern)
    return regex.test(content)
  } catch {
    // If regex parsing fails, treat as plain string
    return content.includes(pattern)
  }
}

/**
 * Get release by ID or tag name.
 *
 * @param {ReturnType<typeof getOctokit>} octokit
 * @param {string} owner
 * @param {string} repo
 * @param {string} releaseId
 * @param {string} tagName
 * @returns {Promise<{id: number, body: string}>}
 */
async function getRelease(octokit, owner, repo, releaseId, tagName) {
  // Priority 1: release-id
  if (releaseId) {
    info(`Fetching release by ID: ${releaseId}`)

    const {data} = await octokit.rest.repos.getRelease({
      owner,
      repo,
      release_id: parseInt(releaseId, 10),
    })

    return {id: data.id, body: data.body || ''}
  }

  // Priority 2: tag-name
  if (tagName) {
    info(`Fetching release by tag: ${tagName}`)

    const {data} = await octokit.rest.repos.getReleaseByTag({
      owner,
      repo,
      tag: tagName,
    })

    return {id: data.id, body: data.body || ''}
  }

  throw new Error('No release-id or tag-name provided, and could not detect from context')
}

;(async () => {
  if (!input.append && !input.prepend) {
    warning('No content to add (both append and prepend are empty)')

    return
  }

  const octokit = getOctokit(input.githubToken)
  const {owner, repo} = context.repo

  // get the release
  const release = await getRelease(octokit, owner, repo, input.releaseId, input.tagName)
  const currentBody = release.body

  info(`Current release body length: ${currentBody.length} characters`)

  // check skip condition
  if (input.skipIfContains && shouldSkip(currentBody, input.skipIfContains)) {
    info(`Skipping update: release notes already contain the specified pattern`)
    setOutput('updated-body', currentBody)
    return
  }

  // build new body
  let newBody = currentBody

  if (input.prepend) {
    newBody = input.prepend + (currentBody ? '\n\n' + currentBody : '')
    info('Prepending content to release notes')
  }

  if (input.append) {
    newBody = (newBody || currentBody) + (newBody || currentBody ? '\n\n' : '') + input.append
    info('Appending content to release notes')
  }

  // Update release
  await octokit.rest.repos.updateRelease({
    owner,
    repo,
    release_id: release.id,
    body: newBody,
  })

  info(`Release notes updated successfully (new length: ${newBody.length} characters)`)
  setOutput('updated-body', newBody)
})().catch(setFailed)
