export const SITE_URL = "https://hoqu.dev";

export const GITHUB_REPO_URL = "https://github.com/dmrock/hoqu";
export const GITHUB_ISSUES_URL = `${GITHUB_REPO_URL}/issues`;

/**
 * Deep links into the issue forms in `.github/ISSUE_TEMPLATE/`. GitHub prefills
 * a form field from any query param matching its `id`, which is how the error
 * screen can hand over its digest — rename a field id there and fix it here.
 */
export const GITHUB_NEW_BUG_URL = `${GITHUB_ISSUES_URL}/new?template=bug_report.yml`;
export const GITHUB_NEW_FEATURE_URL = `${GITHUB_ISSUES_URL}/new?template=feature_request.yml`;
export const GITHUB_NEW_QUESTION_URL = `${GITHUB_ISSUES_URL}/new?template=question.yml`;

/** For anything that shouldn't be filed in public: security, privacy, account trouble. */
export const CONTACT_EMAIL = "hello@hoqu.dev";
