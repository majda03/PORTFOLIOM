# Verified restore points — before this redesign

Recorded 2026-11-21, before publishing the monochrome review preview.

## Original repository state

- Repository: majda03/PORTFOLIOM
- Original main commit: `6172774a792658f65fa9d0bbf7940c95d5015677`
- Original main tree: `798bbf18cfc3a7511093c53a93e5e4aa0f3d374c`
- Preserved remote branch: `backup/portfolio-before-redesign`

## Original live website

- Custom domain: `majdakapetanovic.com`
- Existing deployment: `dpl_EoAFJEE7oYTj2ZgQgiWCEqurU21A`
- Existing deployment URL: `portfolio-majdakapetanovic-lph0nzyzq-majda03s-projects.vercel.app`
- Deployed source commit: `85a112bbd7d4c3259b71d14f8708a2089708c78c`
- Preserved remote branch: `backup/live-portfolio-before-redesign`

The deployed source is recorded separately because the live domain was assigned to a preview before this task began; it was not simply the latest production-target deployment.

## Recovery procedure

The new review is isolated on `preview/monochrome-approval`. Rejecting that review does not require a production rollback: leave the original main and custom-domain assignment in place.

If the live domain is changed later and Majda requests restoration, reassign it to the existing deployment above, after verifying that deployment is still available. If needed, redeploy the preserved live source commit. For the exact pre-edit repository main, restore the tree of the preserved original main commit through a new commit rather than force-rewriting history.

No domain, production deployment, environment variable, authentication or DNS setting is changed by the separate preview publication. No paid purchase or irreversible deletion is involved.
