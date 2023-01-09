import { join } from 'path'
import { tmpdir } from 'os'
import { mkdir, chmod } from 'fs/promises'
import { rm } from 'fs'

/**
 * Create a randomly-named directory in `os.tmpdir()`, await a function call,
 * and delete the directory when finished.
 */
export const useTempDir = async (
  fn: (folder: string) => void | Promise<void>,
  mode?: string | number
) => {
  const folder = join(
    tmpdir(),
    'remix-bun-test-' + Math.random().toString(36).slice(2)
  )
  await mkdir(folder, { recursive: true })

  if (mode) {
    await chmod(folder, mode)
  }

  try {
    await fn(folder)
  } finally {
    await rmdirAsync(folder)
  }
}

const rmdirAsync = async (folder: string) => {
  return new Promise((res, rej) => rm(folder, { force: true, recursive: true }, err => {
    if (err) {
      rej(err)
      return
    }
    res(null)
  }))
}
