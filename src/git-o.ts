import { simpleGit } from 'simple-git';
import type { SimpleGit as ISimpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs/promises';

console.log("Thanks for using us, if u got any errors u can report it to")

export class ChocoGitClient {
  private git: ISimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  /**
   * Clones a Git repository from a given URL to a specified local path.
   *
   * @param repoUrl The URL of the Git repository to clone.
   * @param targetPath The local path where the repository will be cloned.
   * @returns A promise that resolves with the path to the cloned repository.
   * @throws Error If the Git clone operation encounters an issue.
   */
  async chocoCloneRepo(repoUrl: string, targetPath: string): Promise<string> {
    try {
      await this.git.clone(repoUrl, targetPath);
      return targetPath;
    } catch (e: any) {
      throw new Error(`Failed to clone ${repoUrl} to ${targetPath}: ${e?.message || 'Clone error'}`);
    }
  }
}

export class ChocoFileSystemHelper {
  /**
   * Moves a file or directory from a source path to a destination path.
   *
   * @param source The path of the file or directory to move.
   * @param destination The path to where the file or directory will be moved.
   * @returns A promise that resolves when the move operation is complete.
   * @throws Error If the move operation fails.
   */
  async chocoMove(source: string, destination: string): Promise<void> {
    try {
      await fs.rename(source, destination);
    } catch (e: any) {
      throw new Error(`Move failed: ${path.basename(source)} -> ${destination}: ${e?.message || 'Move error'}`);
    }
  }

  /**
   * Recursively removes a directory at a given path. Use with caution.
   *
   * @param dirPath The path of the directory to remove.
   * @returns A promise that resolves when the directory is removed.
   * @throws Error If the directory removal fails.
   */
  async chocoRemoveDir(dirPath: string): Promise<void> {
    try {
      await fs.rm(dirPath, { recursive: true, force: true });
    } catch (e: any) {
      throw new Error(`Dir remove failed: ${dirPath}: ${e?.message || 'Remove error'}`);
    }
  }

  /**
   * Lists the names of files and directories within a given directory.
   *
   * @param dirPath The path of the directory to list.
   * @returns A promise that resolves with an array of the names of the files and directories.
   * @throws Error If reading the directory fails.
   */
  async chocoListDirContents(dirPath: string): Promise<string[]> {
    try {
      return await fs.readdir(dirPath);
    } catch (e: any) {
      throw new Error(`Dir read failed: ${dirPath}: ${e?.message || 'Read error'}`);
    }
  }

  /**
   * Checks if a given path points to a directory.
   *
   * @param filePath The path to check.
   * @returns A promise that resolves with true if the path is a directory, false otherwise.
   */
  async chocoIsDirectory(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isDirectory();
    } catch (e: any) {
      return false;
    }
  }

  /**
   * Creates a directory at the given path if it does not already exist.
   *
   * @param dirPath The path of the directory to ensure existence of.
   * @returns A promise that resolves when the directory exists.
   * @throws Error If the directory creation fails (and it didn't already exist).
   */
  async chocoEnsureDirExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (e: any) {
      if (e?.code !== 'EEXIST') {
        throw new Error(`Dir create failed: ${dirPath}: ${e?.message || 'Create error'}`);
      }
    }
  }

  /**
   * Copies a file from a source path to a destination path.
   *
   * @param source The path of the file to copy.
   * @param destination The path where the file will be copied.
   * @returns A promise that resolves when the copy operation is complete.
   * @throws Error If the copy operation fails.
   */
  async chocoCopyFile(source: string, destination: string): Promise<void> {
    try {
      await fs.copyFile(source, destination);
    } catch (e: any) {
      throw new Error(`File copy failed: ${path.basename(source)} -> ${destination}: ${e?.message || 'Copy error'}`);
    }
  }
}

export class ChocoRepoTransferService {
  private gitClient: ChocoGitClient;
  private fsHelper: ChocoFileSystemHelper;

  constructor() {
    this.gitClient = new ChocoGitClient();
    this.fsHelper = new ChocoFileSystemHelper();
  }

  /**
   * Clones a Git repository and moves its top-level contents to a specified directory.
   *
   * @param repoUrl The URL of the Git repository to clone.
   * @param destinationDir The directory where the contents of the cloned repository will be moved. Defaults to the current working directory.
   * @returns A promise that resolves with the destination directory path.
   * @throws Error If cloning or moving fails.
   */
  async chocoTransferRepoContents(repoUrl: string, destinationDir: string = process.cwd()): Promise<string> {
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

    } catch (e: any) {
      throw new Error(`Repo transfer failed: ${repoUrl}: ${e?.message || 'Transfer error'}`);
    }
  }

  /**
   * Clones a Git repository and copies specific files or directories to a destination directory.
   * Attempts to handle both files and directories.
   *
   * @param repoUrl The URL of the Git repository to clone.
   * @param itemsToCopy An array of file or directory names to copy.
   * @param destinationDir The directory where the specified items will be copied. Defaults to the current working directory.
   * @returns A promise that resolves with the destination directory path.
   * @throws Error If cloning or copying fails.
   */
  async chocoCopyRepoItems(repoUrl: string, itemsToCopy: string[], destinationDir: string = process.cwd()): Promise<string> {
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

    } catch (e: any) {
      throw new Error(`Repo items copy failed: ${repoUrl}: ${e?.message || 'Copy error'}`);
    }
  }

  /**
   * Clones a Git repository and lists its top-level contents.
   *
   * @param repoUrl The URL of the Git repository to clone.
   * @returns A promise that resolves with an array of the top-level file and directory names.
   * @throws Error If cloning or listing fails.
   */
  async chocoListRepoContents(repoUrl: string): Promise<string[]> {
    try {
      const repoName = repoUrl.split('/').pop()?.replace(/\.git$/, '') || 'temp_repo';
      const tempDir = path.join(process.cwd(), `temp_${repoName}_${Date.now()}`);

      const clonedPath = await this.gitClient.chocoCloneRepo(repoUrl, tempDir);
      const contents = await this.fsHelper.chocoListDirContents(clonedPath);
      await this.fsHelper.chocoRemoveDir(tempDir);
      return contents;
    } catch (e: any) {
      throw new Error(`Repo contents list failed: ${repoUrl}: ${e?.message || 'List error'}`);
    }
  }
}
