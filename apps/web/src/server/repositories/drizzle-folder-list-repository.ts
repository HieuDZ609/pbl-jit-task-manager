import { and, asc, count, eq, isNull, ne } from 'drizzle-orm'

import { folders, lists } from '@pbl/db'

import type { Folder, FolderWithLists, List } from './folder-list-repository'
import type { FolderListRepository } from './folder-list-repository'
import type { AppDb } from '@pbl/db'

/**
 * Adapter Drizzle cho FolderListRepository. `userId` gắn vào constructor để mọi
 * truy vấn scope theo user bắt buộc (xem `DrizzleTaskRepository`).
 *
 * Vì `lists.folder_id` chỉ có FK chứ không có `ON DELETE CASCADE`, `removeFolder`
 * phải xoá list trước rồi mới xoá folder — nếu không sẽ vi phạm FK.
 */
export class DrizzleFolderListRepository implements FolderListRepository {
  constructor(
    private readonly db: AppDb,
    private readonly userId: string,
  ) {}

  async createFolder(name: string): Promise<Folder> {
    const existing = await this.db
      .select({ id: folders.id })
      .from(folders)
      .where(and(eq(folders.userId, this.userId), eq(folders.name, name)))
      .limit(1)
    if (existing.length > 0) throw new Error(`Folder "${name}" đã tồn tại`)

    const [row] = await this.db
      .insert(folders)
      .values({ userId: this.userId, name, sortOrder: await this.countFolders() })
      .returning()

    return toFolder(row)
  }

  async createList(name: string, folderId?: string | null): Promise<List> {
    const parentId = folderId ?? null
    if (parentId !== null) await this.assertFolder(parentId)
    await this.assertListNameFree(name, parentId)

    const [row] = await this.db
      .insert(lists)
      .values({ userId: this.userId, folderId: parentId, name, sortOrder: await this.countLists() })
      .returning()

    return toList(row)
  }

  async tree(): Promise<FolderWithLists[]> {
    const allFolders = await this.db
      .select()
      .from(folders)
      .where(eq(folders.userId, this.userId))
      .orderBy(asc(folders.sortOrder), asc(folders.createdAt))

    const allLists = await this.db
      .select()
      .from(lists)
      .where(eq(lists.userId, this.userId))
      .orderBy(asc(lists.sortOrder), asc(lists.createdAt))

    return allFolders.map((folder) => ({
      ...toFolder(folder),
      lists: allLists.filter((l) => l.folderId === folder.id).map(toList),
    }))
  }

  async rootLists(): Promise<List[]> {
    const rows = await this.db
      .select()
      .from(lists)
      .where(and(eq(lists.userId, this.userId), isNull(lists.folderId)))
      .orderBy(asc(lists.sortOrder), asc(lists.createdAt))

    return rows.map(toList)
  }

  async removeFolder(id: string): Promise<void> {
    const scope = and(eq(folders.userId, this.userId), eq(folders.id, id))
    const existing = await this.db.select({ id: folders.id }).from(folders).where(scope).limit(1)
    if (existing.length === 0) return

    // FK `lists.folder_id` không cascade: xoá con trước.
    await this.db.delete(lists).where(and(eq(lists.userId, this.userId), eq(lists.folderId, id)))
    await this.db.delete(folders).where(scope)
  }

  async removeList(id: string): Promise<void> {
    await this.db.delete(lists).where(and(eq(lists.userId, this.userId), eq(lists.id, id)))
  }

  async renameFolder(id: string, name: string): Promise<Folder> {
    await this.assertFolder(id)
    const conflict = await this.db
      .select({ id: folders.id })
      .from(folders)
      .where(
        and(eq(folders.userId, this.userId), eq(folders.name, name), ne(folders.id, id)),
      )
      .limit(1)
    if (conflict.length > 0) throw new Error(`Folder "${name}" đã tồn tại`)

    const [row] = await this.db
      .update(folders)
      .set({ name })
      .where(and(eq(folders.userId, this.userId), eq(folders.id, id)))
      .returning()

    return toFolder(row)
  }

  async renameList(id: string, name: string): Promise<List> {
    const current = await this.requireList(id)
    await this.assertListNameFree(name, current.folderId, id)

    const [row] = await this.db
      .update(lists)
      .set({ name })
      .where(and(eq(lists.userId, this.userId), eq(lists.id, id)))
      .returning()

    return toList(row)
  }

  async findFolder(id: string): Promise<Folder | null> {
    const [row] = await this.db
      .select()
      .from(folders)
      .where(and(eq(folders.userId, this.userId), eq(folders.id, id)))
      .limit(1)

    return row ? toFolder(row) : null
  }

  async findList(id: string): Promise<List | null> {
    const [row] = await this.db
      .select()
      .from(lists)
      .where(and(eq(lists.userId, this.userId), eq(lists.id, id)))
      .limit(1)

    return row ? toList(row) : null
  }

  private async assertFolder(id: string): Promise<void> {
    if ((await this.findFolder(id)) === null) {
      throw new Error(`Folder ${id} không tồn tại`)
    }
  }

  private async assertListNameFree(name: string, folderId: string | null, exceptId?: string): Promise<void> {
    const conflict = await this.db
      .select({ id: lists.id })
      .from(lists)
      .where(
        and(
          eq(lists.userId, this.userId),
          eq(lists.name, name),
          folderId === null ? isNull(lists.folderId) : eq(lists.folderId, folderId),
          exceptId ? ne(lists.id, exceptId) : undefined,
        ),
      )
      .limit(1)
    if (conflict.length > 0) throw new Error(`List "${name}" đã tồn tại trong phạm vi này`)
  }

  private async requireList(id: string): Promise<List> {
    const list = await this.findList(id)
    if (list === null) throw new Error(`List ${id} không tồn tại`)
    return list
  }

  private async countFolders(): Promise<number> {
    const [row] = await this.db
      .select({ value: count() })
      .from(folders)
      .where(eq(folders.userId, this.userId))
    return row?.value ?? 0
  }

  private async countLists(): Promise<number> {
    const [row] = await this.db.select({ value: count() }).from(lists).where(eq(lists.userId, this.userId))
    return row?.value ?? 0
  }
}

function toFolder(row: typeof folders.$inferSelect): Folder {
  return { id: row.id, name: row.name, color: row.color ?? null, sortOrder: row.sortOrder ?? 0 }
}

function toList(row: typeof lists.$inferSelect): List {
  return {
    id: row.id,
    folderId: row.folderId ?? null,
    name: row.name,
    color: row.color ?? null,
    sortOrder: row.sortOrder ?? 0,
  }
}
