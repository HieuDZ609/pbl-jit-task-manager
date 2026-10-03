import {
  createFolder,
  createList,
  deleteFolder,
  deleteList,
  getFolderTree,
  getRootLists,
  renameFolder,
  renameList,
} from '@/server/actions/folder-list-actions'
import { createTask, deleteTask, getTasks, setTaskDone } from '@/server/actions/task-actions'
import { TasksWorkspace } from '@/features/tasks/tasks-workspace'

export default async function TasksPage() {
  const [tasks, tree, rootLists] = await Promise.all([getTasks(), getFolderTree(), getRootLists()])

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Tasks</h1>
      <TasksWorkspace
        initialTasks={tasks}
        tree={tree}
        rootLists={rootLists}
        onCreate={createTask}
        onToggle={setTaskDone}
        onDelete={deleteTask}
        onCreateFolder={createFolder}
        onRenameFolder={renameFolder}
        onDeleteFolder={deleteFolder}
        onCreateList={createList}
        onRenameList={renameList}
        onDeleteList={deleteList}
      />
    </section>
  )
}