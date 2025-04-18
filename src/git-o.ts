const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs').promises;

class ChocoGitClient {
  constructor() {
    this.git = simpleGit();
  }

  async chocoCloneRepo(repoUrl, targetPath) {
    try {
      await this.git.clone(repoUrl, targetPath);
      return targetPath;
    } catch (e) {
      throw new Error(`Failed to clone ${repoUrl} to ${targetPath}: ${e?.message || 'Clone error'}`);
    }
  }
}

class ChocoFileSystemHelper {
  async chocoMove(source, destination) {
    try {
      await fs.rename(source, destination);
    } catch (e) {
      throw new Error(`Move failed: ${path.basename(source)} -> ${destination}: ${e?.message || 'Move error'}`);
    }
  }

  async chocoRemoveDir(dirPath) {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (e) {
      throw new Error(`Dir remove failed: ${dirPath}: ${e?.message || 'Remove error'}`);
    }
  }

  async chocoListDirContents(dirPath) {
    try {
      return await fs.readdir(dirPath);
    } catch (e) {
      throw new Error(`Dir read failed: ${dirPath}: ${e?.message || 'Read error'}`);
    }
  }

  async chocoIsDirectory(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.isDirectory();
    } catch (e) {
      return false;
    }
  }

  async chocoEnsureDirExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (e) {
      if (e?.code !== 'EEXIST') {
        throw new Error(`Dir create failed: ${dirPath}: ${e?.message || 'Create error'}`);
      }
    }
  }

  async chocoCopyFile(source, destination) {
    try {
      await fs.copyFile(source, destination);
    } catch (e) {
      throw new Error(`File copy failed: ${path.basename(source)} -> ${destination}: ${e?.message || 'Copy error'}`);
    }
  }
}

class ChocoRepoTransferService {
  constructor() {
    this.gitClient = new ChocoGitClient();
    this.fsHelper = new ChocoFileSystemHelper();
  }

  async chocoTransferRepoContents(repoUrl, destinationDir = process.cwd()) {
    try {
      const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'temp_repo';
      const tempDir = path.join(process.cwd(), `temp_${repoName}_${Date.now()}`);

      const clonedPath = await this.gitClient.chocoCloneRepo(repoUrl, tempDir);
      const contents = await this.fsHelper.chocoListDirContents(clonedPath);

      await Promise.all(
        contents.map(async (item) => {
          const sourcePath = path.join(clonedPath, item);
          const destPath = path.join(destinationDir, item);
          await this.fsHelper.chocoMove(sourcePath, destPath);
        })
      );

      await this.fsHelper.chocoRemoveDir(tempDir);
      return destinationDir;

    } catch (e) {
      throw new Error(`Repo transfer failed: ${repoUrl}: ${e?.message || 'Transfer error'}`);
    }
  }

  async chocoCopyRepoItems(repoUrl, itemsToCopy, destinationDir = process.cwd()) {
    try {
      const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'temp_repo';
      const tempDir = path.join(process.cwd(), `temp_${repoName}_${Date.now()}`);

      const clonedPath = await this.gitClient.chocoCloneRepo(repoUrl, tempDir);
      await this.fsHelper.chocoEnsureDirExists(destinationDir);

      await Promise.all(
        itemsToCopy.map(async (item) => {
          const sourcePath = path.join(clonedPath, item);
          const destPath = path.join(destinationDir, item);
          const isDir = await this.fsHelper.chocoIsDirectory(sourcePath);

          if (isDir) {
            await this.fsHelper.chocoEnsureDirExists(destPath);
          } else {
            await this.fsHelper.chocoCopyFile(sourcePath, destPath);
          }
        })
      );

      await this.fsHelper.chocoRemoveDir(tempDir);
      return destinationDir;

    } catch (e) {
      throw new Error(`Repo items copy failed: ${repoUrl}: ${e?.message || 'Copy error'}`);
    }
  }

  async chocoListRepoContents(repoUrl) {
    try {
      const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'temp_repo';
      const tempDir = path.join(process.cwd(), `temp_${repoName}_${Date.now()}`);

      const clonedPath = await this.gitClient.chocoCloneRepo(repoUrl, tempDir);
      const contents = await this.fsHelper.chocoListDirContents(clonedPath);
      await this.fsHelper.chocoRemoveDir(tempDir);
      return contents;
    } catch (e) {
      throw new Error(`Repo contents list failed: ${repoUrl}: ${e?.message || 'List error'}`);
    }
  }
}
const { exec, spawn } = require('child_process');

/**
 * Checks if GithubCLI is installed and then attempts to log in by running "gh auth login".
 * Note: This function will likely require manual interaction from the user
 * in the terminal or a web browser to complete the login process.
 * @returns {Promise<string>} A Promise that resolves with the stdout of the login process if successful.
 * @throws {Error} If GithubCLI is not found or if the login process fails.
 */
async function login() {
  return new Promise((resolve, reject) => {
    exec('gh --version', (error, stdout, stderr) => {
      if (error) {
        return reject(new Error("GithubCLI not found or not executable. Please download and install it."));
      }

      const p = spawn("gh", ["auth", "login"]);
      let stdoutData = '';
      let stderrData = '';

      p.stdout.on('data', (data) => {
        stdoutData += data.toString();
        console.log(`stdout: ${data}`);
      });

      p.stderr.on('data', (data) => {
        stderrData += data.toString();
        console.error(`stderr: ${data}`);
      });

      p.on('close', (code) => {
        if (code === 0) {
          resolve(stdoutData);
        } else {
          reject(new Error(`GitHub CLI login failed with exit code ${code}. Error (stderr): ${stderrData}`));
        }
      });
      loginProcess.on('error', (err) => {
        reject(new Error(`Failed to start GitHub CLI login process: ${err.message}`));
      });
    });
  });
}

/**
 * Clones a repo by running "git clone <repo>"
 * 
 * @param repoURL Repo to copy.
 * @example
 * const { gitClone } = require("choco-package")
 * 
 * gitClone("https://github.com/bilinmeyendev/choco-package")
 */
/**
 * Clones a Git repository from the given URL to the specified local path.
 * @param {string} repoURL - The URL of the Git repository to clone.
 * @param {string} targetPath - The local path where the repository should be cloned.
 * @returns {Promise<string>} A Promise that resolves with a success message upon completion,
 * or rejects with an error message if cloning fails.
 */
function gitClone(repoURL, targetPath = '.') {
  return new Promise((resolve, reject) => {
    exec(`git clone "${repoURL}" "${path.resolve(targetPath)}"`, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`Git clone failed: ${stderr}`));
        return;
      }
      resolve(`Git repository cloned successfully to: ${path.resolve(targetPath)}`);
    });
  });
}

module.exports = {
  ChocoGitClient,
  ChocoFileSystemHelper,
  ChocoRepoTransferService,
  login,
  gitClone
}
