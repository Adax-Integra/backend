## Branch, Commit, and PR Conventions

**Important Note:** Everything must be written in English.

### Branch Conventions

Branch names must follow a specific structure, and the `<description>` part must be written in **camelCase**.

**Standard Format (with User Story):**
`label/{us-code}-<description>`

The primary labels to use are `feat`, `fix`, `refactor`, `docs`, and `chore`.

**Examples:**

- `feat/r-01-login`

- `fix/v-07-submitCase`

- `refactor/g-02-registerExternal`

**Format (without User Story):**
If the branch does not belong to a specific user story, omit the `{us-code}` and just use the label and description.

`label/<description>`

**Example:**

- `docs/readme`

### Pull Request and Commit Conventions

Pull Requests titles and Commit messages share the same format. They must follow **conventional commits**, always in lowercase.

**Format:**
`label({us-code}): <description>`
_(Note: As with branches, omit the `({us-code})` scope if the commit is not tied to a specific user story)._

**Examples:**

- `feat(v-02): add info visualization`

- `docs(r-01): add openapi docs`

- `docs: update project readme`

## Pull Request Template & Contribution Guidelines

## Description

## Type of Change

<!-- Check one or more of the following options, and delete the others. -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] This change requires documentation update
- [ ] Refactor (code structure improvements, no new functionality)
- [ ] Tests (addition or improvement of tests)
- [ ] Chore (changes to tooling, CI/CD, or metadata)

## Checklist

<!--
  Go over all the following points, and put an `x` in all the boxes that apply.
  If you're unsure about any of them, don't hesitate to ask. We're here to help!
-->

- [ ] My code follows the project's coding style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation (if applicable)
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published in downstream modules
