import { expect } from "bun:test"
import { file } from "bun"
import { join } from "path"

export type Project = {
  cwd: string
  files: string[]
}

export const projectFilesShouldExists = ({
  cwd,
  files,
}: Project) => {
  for (const projectFile of files) {
    try {
      const size = file(join(cwd, projectFile)).size
      console.log({ projectFile, size })
      expect(size).toBeGreaterThan(0)
    } catch (err) {
      console.log("ERR", err)
      throw err
    }
  }
}
