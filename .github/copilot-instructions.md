# Nanoumada Copilot Instructions

Read `AGENTS.md` first. Nanoumada is a **browser-based AI coding workspace/web app** based on Bolt.diy. Treat web UI, web server/API, supported AI provider settings, browser preview, tests, typecheck and production web build as the main scope. Do not create/build/package/sign/install/release an APK unless the user explicitly switches the task to native Android.

Running in Android/Termux means the server is hosted on the phone and viewed in its browser; it is not a native mobile app. Keep Nanoumada distinct from Nanou Browser (remote browser automation service + MCP), Mada Commander (separate custom MCP/control plane) and LudoMada (Android Ludo game/backend). Never reuse their credentials, deployment IDs, database, CI settings or runner configs.

Inspect the current branch, exact SHA, PR and working-tree changes before editing. Preserve upstream Bolt.diy licensing and notices. Diagnose the root cause before retrying CI; test the exact change and record evidence. Do not deploy over the wrong linked project or make assumptions from the presence of Android/Termux helper scripts.
