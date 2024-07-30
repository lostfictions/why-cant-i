why cant i, hold all these different kinds of item

**https://mastodon.social/@limeguy**

~~https://twitter.com/limesbot~~ (twitter bot broken with x dot com's api changes)

![why cant I, hold all these](https://i.imgur.com/gBDp6Qs.png)

runs using github actions' [scheduled events](https://docs.github.com/en/actions/reference/events-that-trigger-workflows#scheduled-events). thanks to simon willison for [the inspiration for this setup](https://simonwillison.net/2020/Oct/9/git-scraping/).

i unfortunately haven't documented this approach very well yet. for now, you can [check out the github workflow file](.github/workflows/twoot.yml). you can also look at the environment variables (required and optional) in [env.ts](src/env.ts).

> as part of this approach, you'll need an "orphan" git branch (one that doesn't share any history with the main branch) in the same repo. this is where state that's persisted across bot runs is stored (the branch is appropriately named "data"). if you've forked this repo with all its branches, this should already exist. if not -- well, it's a bit clunky to create. for now, the recommended approach is to make sure you're on a clone with the remote set correctly and that the file `persist/unused_concepts.json` exists locally (you may have to run `yarn dev`). then run `npx gh-pages -d persist -b data`.

###### [more bots?](https://github.com/lostfictions?tab=repositories&q=botally)
