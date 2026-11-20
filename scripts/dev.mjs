import { spawn } from "node:child_process";

const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
const devProcess = spawn(cmd, ["next", "dev", "--webpack"], {
  stdio: "inherit",
});

devProcess.on("exit", (code) => {
  process.exit(code ?? 0);
});
