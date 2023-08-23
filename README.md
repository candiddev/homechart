# [Homechart](https://homechart.app)

> Your Handy Home Assistant

[![Integration](https://github.com/candiddev/homechart/actions/workflows/integration.yaml/badge.svg?branch=main)](https://github.com/candiddev/homechart/actions/workflows/integration.yaml)

[:book: Docs](https://homechart.app/docs/)\
[:motorway: Roadmap](https://github.com/orgs/candiddev/projects/6/views/23)

## Features

Homechart simplifies your digital life:

😍 **No more duplication**\
One place for all your household data

📅 **One calendar for everything**\
Plan events, meals, chores, and more

🔗 **Save money for what matters**\
Link your budgets, projects, and shopping lists

📣 **Keep your household in sync**\
Reminders for events, meals, tasks, and more

👪 **Designed for everyone in your household**\
Supports extended, divorced, and blended families

🗣️ **Multilingual**\
Available in English, عربي, Deutsch, Español, Francais, हिन्दी, Nederlands, and 中文

🙌 **No ads, ever**\
We will never sell your data, we just help you manage it

🤓 **Secure, Encrypted and Private**\
Homechart runs in the cloud or self-hosted on your network

Visit https://homechart.app for more information.

## License

The code in this repository is licensed under the [Elastic License](https://www.elastic.co/licensing/elastic-license).

## Development

Our development process is mostly trunk-based with a `main` branch that folks can contribute to using pull requests.  We tag releases as necessary using CalVer.

### Repository Layout

- `./github:` Reusable GitHub Actions
- `./go:` Homechart sever code
- `./hugo:` YAML8n website
- `./shell:` Development tooling
- `./shared:` Shared libraries from https://github.com/candiddev/shared
- `./web:` Homechart UI code

Make sure you initialize the shared submodule:

```bash
git submodule update --init
```

### CI/CD

We use GitHub Actions to lint, test, build, release, and deploy the code.  You can view the pipelines in the `.github/workflows` directory.  You should be able to run most workflows locally and validate your code before opening a pull request.

### Tooling

Visit [shared/README.md](shared/README.md) for more information.
