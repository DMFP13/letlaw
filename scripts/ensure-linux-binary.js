/**
 * Downloads the @libsql/linux-x64-gnu native binary if it's missing.
 * npm on macOS skips cross-platform optional deps, so we do it manually
 * before every build to ensure the Netlify/Linux function bundle works.
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const PACKAGE = "@libsql/linux-x64-gnu";
const VERSION = "0.5.29";
const targetDir = path.join(__dirname, "..", "node_modules", "@libsql", "linux-x64-gnu");
const binaryPath = path.join(targetDir, "index.node");

if (fs.existsSync(binaryPath)) {
  console.log(`✓ ${PACKAGE} binary already present`);
  process.exit(0);
}

console.log(`⬇ Downloading ${PACKAGE}@${VERSION} for Linux x64...`);
const tarball = `libsql-linux-x64-gnu-${VERSION}.tgz`;

try {
  execSync(`npm pack ${PACKAGE}@${VERSION} --quiet`, { stdio: "inherit" });
  fs.mkdirSync(targetDir, { recursive: true });
  execSync(`tar -xzf "${tarball}" --strip-components=1 -C "${targetDir}"`);
  fs.unlinkSync(tarball);
  console.log(`✓ ${PACKAGE} installed at ${targetDir}`);
} catch (err) {
  console.error(`✗ Failed to install ${PACKAGE}:`, err.message);
  process.exit(1);
}
