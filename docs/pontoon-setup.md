# Mozilla Pontoon Self-Hosted Setup

## Launching Pontoon Container

Follow the [Developer Setup](https://mozilla-pontoon.readthedocs.io/en/latest/dev/setup.html) guide.


<sub>Prerequisites & Quickstart copy from 2024-09-13</sub>

> Prerequisites
> -------------
> 
> 1. Install `Docker <https://docs.docker.com/install/>`_.
> 
> 2. Install `Node.js 14 and npm 7 or later <https://docs.npmjs.com/downloading-and-installing-node-js-and-npm>`_.
> 
> 3. Install `make <https://www.gnu.org/software/make/>`_ using either your
>    system's package manager (Linux) or Xcode command line developer tools (OSX).
>    On Windows, you can use `MozillaBuild <https://wiki.mozilla.org/MozillaBuild>`_.
> Quickstart
> ----------
> 
> 1. Clone the `Pontoon repository <https://github.com/mozilla/pontoon>`_::
> 
>      $ git clone https://github.com/mozilla/pontoon.git
> 
>    .. Note::
> 
>         To contribute changes to the project, you will need to
>         `fork <https://help.github.com/en/github/getting-started-with-github/fork-a-repo>`_
>         the repository under your own GitHub account.
> 
> 
> 2. From the root of the repository, run::
> 
>      $ make build
> 
>    That will install Pontoon's JS dependencies,
>    build the frontend packages, and build the server container.
> 
>    .. Note::
> 
>         If you want to share your development instance in your local network,
>         set SITE_URL to bind the server to any address you like, e.g.
>         ``make build SITE_URL="http://192.168.1.14:8000"``.
> 
> 
> 3. Run the webapp::
> 
>       $ make run
> 
>    .. Note::
> 
>         The first time you run this, the PostgreSQL container needs to do
>         some work before it becomes available to the server container. Hence,
>         the server might not be able to perform things like migrations.
>         You can simply wait for the postgresql container to report that it's
>         ready, then abort the process, then restart it. That should let the
>         server do all its setup as expected.
> 
>         Alternatively, you can run ``docker-compose up postgresql`` and wait
>         until it reports that the database is ready, then stop that and run
>         ``make run``.
> 
> 
> 4. Finally, you need to run some setup steps, while the server is running::
> 
>       $ make setup
> 
>    This will ask you to create a superuser, and then will update your Firefox
>    account settings.
> 
> The app should now be available at http://localhost:8000 or the custom SITE_URL.
> 
> And with that, you're ready to start :doc:`contributing`!

## Adding You Project to Pontoon

Follow the [Adding a new project to Pontoon](https://mozilla-pontoon.readthedocs.io/en/latest/user/localizing-your-projects.html#adding-a-new-project-to-pontoon) guide

<sub>Copy from 2024-09-13</sub>

> Adding a new project to Pontoon
> -------------------------------
> When accessing your deployed app, your email address is your login in the Sign
> In page and your password is the one picked during setup. After you log in,
> access Pontoon Admin (``/admin/``), click **ADD NEW PROJECT** and fill out the
> following required fields:
> 
> 1. **Name**: name of the project to be displayed throughout Pontoon app. The
>    following project names are reserved: ``Terminology``, ``Tutorial``,
>    ``Pontoon Intro``.
> 1. **Slug**: used in URLs, will be generated automatically based on the Name.
> 1. **Locales**: select at least one Localizable locale by clicking on it.
> 1. **Repository URL**: enter your repository's SSH URL of the form
>    ``git@github.com:user/repo.git``.
> 1. **Download prefix or path to TOML file**: a URL prefix for downloading localized files. For
>    GitHub repositories, select any localized file on GitHub, click ``Raw`` and
>    replace locale code and the following bits in the URL with ``{locale_code}``.
>    If you use one, you need to select the `project configuration file`_ instead
>    of a localized file.
> 1. Click **SAVE PROJECT** at the bottom of the page.
> 1. After the page reloads, click **SYNC** and wait for Pontoon to import
>    strings. You can monitor the progress in the Sync log (``/sync/log/``).
> 1. When the synchronization is finished, you should check the imported resources
>    and the entities. If everything went okay, you can proceed to the next step.
> 1. Go to the project's admin page and change the visibility option to make
>    the project public. It's required because all new projects in Pontoon are private
>    by default and aren't visible to localizers and locale managers.
> 
> For complete documentation of the Admin form, please refer to Mozilla's
> `new project documentation`_.
> 
> At this point you are ready to `start localizing your project`_ at
> ``/projects/SLUG/``!
> 
> .. _new project documentation: https://mozilla-l10n.github.io/documentation/tools/pontoon/adding_new_project.html
> .. _start localizing your project: https://mozilla-l10n.github.io/localizer-documentation/tools/pontoon/

### Data Source example 

#### Without write access (https)

![Pontoon Data Source example (no write access)](/docs/img/pontoon-data-source.png)

### WITH write acess (github token)

1. Go to the Github -> Settings -> Developer Settings -> [Personal Access Token (PAT) -> Token (classic)](https://github.com/settings/tokens)
2. Generate new token -> Generate new token (classic) 
3. Select `repo` and `workflow` for the permission.
    - For `experiation` choose what matches your needs
4. Generate the token and copy it
5. Next open the admin page of your pontoon project (`/admin/projects/<PROJECT_NAME>/`)
6. Under `Repositories` in the `URL` field put the repo url + the previously generated PAT and put it in there like this
    - `https://<GITHUB_PAT>@github.com/<GITHUB_USER>/<GITHUB_PROJECT>.git`
7. Make sure to pick a seperate branch for it since pontoon will push to the given branch! E.g. `translations`, `i18n` or `pontoon`.
8. **Make sure to clean up the `Public Repository Website` input as you don't want to expose your PAT!**
9. Double check the `Download prefix or path to TOML file`.
    - It should look something like this for pokerogue: `src/locales/{locale_code}`
10. Click `Save Project`
11. Scroll back down and click `Sync` -> Any changes already made will now be pushed to the picked branch!
12. Check on GitHub if the branch has (expected) changes.
13. Done!

![pontoon-repo-with-pat](/docs/img/pontoon-repo-with-pat.png)

## Admin UI acess

There is two admin UIs. One for pontoon and one for the server (django). Both have their relevance

### Pontoon Admin UI

Accessible via the `/admin` path.

![Pontoon Admin UI](/docs/img/pontoon-admin-ui.png)

### Server (django) Admin UI

Accessible via the `/a` path.

![Django Admin UI](/docs/img/django-admin-ui.png)

## Assigning Roles 

I still havent figured this part fully out but you have to use the django admin UI for it.

1. Go to `/a/auth/user`
2. Select the user you want to edit and click on their email to open the update page.
3. Scroll a bit down and you should see a huge `Groups` and `User Permissions` matrix.
    - ![pontoon-groups-permissions-matrix](/docs/img/pontoon-groups-permissions-matrix.png) 
4. Go Wild!