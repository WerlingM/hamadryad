# Commits

No need to include a "co-authored by Claude" statement in every commit message.

Commit messages should be concise, describing the major change and reasoning.
Don't use emoji/icons on commit messages

# Containers and Docker
Use podman, podman compose instead of docker.

# Code

* Before calling a task complete make sure the project passes any linting, formatting, and build checks
* Keep file sizes as small as appropriate, code should be modular for maintainability and reuse
* Avoid duplication unless absolutely necessary


# Documentation
* In general do not include code in documentation for plans in the repo.
* Only have code in documentation where it is useful as an example, identifies a special edge case or technique
* Put documentation in docs folder at root of project
* All documentation should be accessible via links in a hierarchical structure, with an index.md file at the top level of the docs folder
* Do not duplicate documentation, instead use links to single source, including in the project README.md file
* Project README.md should be an overview of the project and then lead the user to the docs index
* Major documentation sections include
  * Architecture and Design - Overview of the design of the system including structure, schemas, and use cases
  * Developer Guide - instructions for developers running the project, overview of the code layout.  How to run the project locally, how to deploy
  * User Guide - Use of the application, documentation that can be shared with end users

# Project Memory
Persistent project context (overview, stack, user preferences, current status) lives in `.claude/memory/` — start with `.claude/memory/MEMORY.md`. Planning docs: `concept.md`, `plan.md`, `sprint1.md`.
