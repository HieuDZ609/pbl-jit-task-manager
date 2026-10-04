'use server'

import { revalidatePath } from 'next/cache'
import { currentRepos } from '@/server/repositories'
import type { ElearningItemInput } from '@/services/elearning/types'

export async function importElearningItems(items: ElearningItemInput[]) {
  if (!Array.isArray(items)) throw new Error('Danh sách không hợp lệ')
  const repos = await currentRepos()
  await repos.elearning.save(items)
  revalidatePath('/elearning')
}
