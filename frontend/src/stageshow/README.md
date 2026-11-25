# stageshow kit (vendored)

`kit/` is copied from the stageshow skill. The source is benji.org/stageshow and the repository is github.com/benjitaylor/skills, folder `stageshow/kit`. The skill's package.json declares the MIT license.

The only local change is one unused import removed from `kit/phone.tsx`, so the file passes this project's `noUnusedLocals`.

It is used by `features/auth/LeaveDemo.tsx`, the login page hero. Its only extra dependency is `lucide-react@0.468.0`.
