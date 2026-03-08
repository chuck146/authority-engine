# UX Impact

After a commit, analyze the code changes for user experience impact and update `docs/user-experience.md`.

## Steps

1. Get the latest commit diff to identify what changed:

```bash
git diff HEAD~1 HEAD --name-only
git diff HEAD~1 HEAD
```

2. Filter for UX-relevant changes. These paths indicate something users see or interact with changed:
   - `components/` — UI components
   - `app/(dashboard)/` — authenticated app pages
   - `app/(marketing)/` — public SEO pages
   - `app/(auth)/` — login/auth flows
   - `app/api/` — API routes that power UI (check if they feed data to dashboard components)
   - `app/layout.tsx`, `app/globals.css` — global layout/styling

   Skip if changes are only in:
   - Test files (`__tests__/`, `*.test.*`)
   - Pure library internals (`lib/queue/`, `lib/sms/`, workers)
   - Type definitions with no UI effect
   - Documentation files
   - Config files

   If no UX-relevant files changed, say "No UX impact detected" and stop.

3. Read `docs/user-experience.md` to understand the current documentation structure.

4. Map the changed files to the correct doc section using these associations:

   | Changed Path                                                    | Doc Section                             |
   | --------------------------------------------------------------- | --------------------------------------- |
   | `app/(marketing)/services/`, `components/marketing/service-*`   | Public Marketing Pages > Service Pages  |
   | `app/(marketing)/locations/`, `components/marketing/location-*` | Public Marketing Pages > Location Pages |
   | `app/(marketing)/blog/`, `components/marketing/blog-*`          | Public Marketing Pages > Blog Posts     |
   | `app/(auth)/`, `app/api/auth/`                                  | Authentication                          |
   | `components/dashboard/app-sidebar.tsx`, `app/layout.tsx`        | Dashboard Shell                         |
   | `app/(dashboard)/dashboard/`, `components/dashboard/`           | Dashboard Home                          |
   | `app/(dashboard)/content/`, `components/content/`               | Content Engine                          |
   | `app/(dashboard)/calendar/`, `components/calendar/`             | Content Calendar                        |
   | `app/(dashboard)/media/`, `components/media/`                   | Media Library                           |
   | `app/(dashboard)/social/`, `components/social/`                 | Social & GBP                            |
   | `app/(dashboard)/seo/`, `components/seo/`                       | SEO Command Center                      |
   | `app/(dashboard)/reviews/`, `components/reviews/`               | Review Command Center                   |
   | `app/(dashboard)/settings/`, `components/settings/`             | Settings                                |
   | `app/(dashboard)/video/`, `components/video/`                   | (new section if not yet documented)     |

5. Read the changed component/page files to understand what the user now sees or can do differently. Focus on:
   - New UI elements (buttons, tabs, forms, cards, columns)
   - Changed labels, options, or display formats
   - New workflows or flow changes
   - Removed features or options
   - Changed navigation or layout

6. Edit the affected section(s) in `docs/user-experience.md`:
   - Write from the **user's perspective** — what they see and do, not what the code does
   - Match the existing document's tone: descriptive, present tense, concrete
   - Use the same formatting patterns (bold labels, tables, code blocks for layouts, bullet lists for details)
   - If a change adds an entirely new page or flow, add a new subsection and update the Table of Contents
   - Keep edits surgical — only change the lines affected, don't rewrite surrounding content

7. Show a brief summary of what was updated:
   - Which section(s) were modified
   - What UX change was captured
   - The before/after of the edited lines
