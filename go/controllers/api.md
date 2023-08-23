_The API to your handy home assistant.  Manage budgets, calendars, tasks, recipes, notes, and more._

# API Responses

All API responses are wrapped within a [Response](#model-Response).  The `dataType` property specifies the underlying type of the `dataValue`.  `dataValue` **will always be an array**, even if it just contains one item.  This helps clients avoid having to figure out if it's an array or a single item.

# Getting Started

To authorize your API responses, generate an API key via the [Homechart UI (Settings > Sessions)](/settings/sessions) or the [Homechart API POST /auth/sessions operation](#operations-AuthSession-post_auth_sessions).
