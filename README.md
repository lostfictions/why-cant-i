why cant i, hold all these different kinds of item

**https://twitter.com/limesbot**

**https://mastodon.social/@limeguy**

![why cant I, hold all these](https://i.imgur.com/gBDp6Qs.png)

runs using github actions' [scheduled
events](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#scheduled-events).
thanks to simon willison for [the inspiration for this
setup](https://simonwillison.net/2020/Oct/9/git-scraping/).

i unfortunately haven't documented this approach very well yet. for now, you can
[check out the github workflow file](.github/workflows/twoot.yml). you can also
look at the environment variables (required and optional) in
[env.ts](src/env.ts).

this is also more of a note to self than a proper piece of documentation now,
but: to regenerate the disjoint git branch that the unused concept list is
stored in, make sure you're on a clone with the remote set correctly and that
the file `persist/unused_concepts.json` exists locally (you may have to run
`yarn dev`). then run `npx gh-pages -d persist -b data`.

###### [more bots?](https://github.com/lostfictions?tab=repositories&q=botally)
