const { exec } = require("child_process");

exec("python --version", (error, stdout, stderr) => {
  if (error) {
    console.error("Python error:", error.message);
    return;
  }
  console.log("Python version:", stdout || stderr);
});
