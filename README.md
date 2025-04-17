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

```typescript
import { RepoUtils, FileSystemUtils } from 'choco-package';

async function main() {
  const repoUtils = new RepoUtils();
  const fileSystemUtils = new FileSystemUtils(); // Example usage
  const repoUrl = '[https://github.com/example/example-repo.git](https://github.com/example/example-repo.git';
  const destinationDir = './destination-directory';

  try {
    // Transfer all content
    await repoUtils.transferRepoContents(repoUrl, destinationDir);
    console.log(`Repository content transferred to ${destinationDir}.`);

    // Copy specific items
    const itemsToCopy = ['file1.txt', 'directory1/'];
    await repoUtils.copyRepoItems(repoUrl, itemsToCopy, destinationDir);
    console.log(`Selected items copied to ${destinationDir}.`);

    // List repo content
    const contents = await repoUtils.listRepoContents(repoUrl);
    console.log(`Repository content: ${contents.join(', ')}`);

    // FileSystemUtils example usage
    const isDir = await fileSystemUtils.isDirectory('./');
    console.log(`Is current directory a directory: ${isDir}`);

  } catch (error: any) {
    console.error(`An error occurred: ${error.message}`);
  }
}

main();
```

## Docs
Coming soon...