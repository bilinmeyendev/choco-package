# choco-package

choco-package is a Node.js module designed to facilitate cloning Git repositories and managing their contents. It simplifies operations like copying specific files or directories from a repository or transferring a repository's contents to a different location.

## Features

* **Repo Cloning:** Clone a Git repository from a specified URL.
* **File/Directory Moving:** Move files or directories from one location to another.
* **Directory Removal:** Recursively remove a directory and its contents.
* **Directory Content Listing:** Retrieve a list of files and directories within a directory.
* **File/Directory Check:** Determine if a given path is a file or a directory.
* **Directory Creation:** Create a directory if it doesn't already exist.
* **File Copying:** Copy a file from one location to another.
* **Selective Item Copying:** Copy specific files or directories from a repository.

## Installation

To use this module, ensure you have Node.js and npm (or yarn) installed.

1.  Install the module in your project:

    ```bash
    npm install choco-package
    ```

    or

    ```bash
    yarn add choco-package
    ```

## Usage

```javascript
const { ChocoRepoTransferService, ChocoFileSystemHelper, ChocoGitClient } = require('choco-package');

async function main() {
  const repoTransferService = new ChocoRepoTransferService();
  const fileSystemHelper = new ChocoFileSystemHelper();
  const gitClient = new ChocoGitClient();

  const repoUrl = 'https://github.com/example/example-repo.git';
  const destinationDir = './destination-directory';

  try {
    // Transfer all content
    await repoTransferService.chocoTransferRepoContents(repoUrl, destinationDir);
    console.log(`Repository content transferred to ${destinationDir}.`);

    // Copy specific items
    const itemsToCopy = ['file1.txt', 'directory1/'];
    await repoTransferService.chocoCopyRepoItems(repoUrl, itemsToCopy, destinationDir);
    console.log(`Selected items copied to ${destinationDir}.`);

    // List repo content
    const contents = await repoTransferService.chocoListRepoContents(repoUrl);
    console.log(`Repository content: ${contents.join(', ')}`);

    // FileSystemHelper usage example
    const isDir = await fileSystemHelper.chocoIsDirectory('./');
    console.log(`Is current directory a directory: ${isDir}`);

    // GitClient usage example
    const clonedRepoPath = await gitClient.chocoCloneRepo(repoUrl, './cloned-repo');
    console.log(`Repository cloned to: ${clonedRepoPath}`);

  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
}

main();
```

# Changelog
* **Typescript to JS:** Due to some problems, we maked it typescript to javascript.
* **New version:** 1.3.7, came with problem fixes! if u got any errors u can report it to our github page.
* **New functions:** In 1.3.7 new functions added: login(), logins with GithubCLI if exists, gitClone(repo), clones a repo that given.


## Docs
Coming soon...
