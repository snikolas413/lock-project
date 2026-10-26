import { bigint, date, index, numeric, pgTable, primaryKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

const createdAt = () => timestamp('created_at', { withTimezone: true }).defaultNow().notNull();
const updatedAt = () => timestamp('updated_at', { withTimezone: true }).defaultNow().notNull();

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdBy: uuid('created_by').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
export const workspaceMembers = pgTable('workspace_members', {
  workspaceId: uuid('workspace_id').notNull(),
  userId: uuid('user_id').notNull(),
  role: text('role').notNull().default('member'),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.workspaceId, t.userId] }), index('workspace_members_user_id_idx').on(t.userId)]);
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  name: text('name').notNull(),
  key: text('key').notNull(),
  description: text('description'),
  status: text('status').notNull().default('active'),
  createdBy: uuid('created_by').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [unique('projects_workspace_id_key_unique').on(t.workspaceId, t.key), index('projects_workspace_id_idx').on(t.workspaceId)]);
export const issues = pgTable('issues', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  issueNumber: bigint('issue_number', { mode: 'number' }).generatedByDefaultAsIdentity().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull().default('task'),
  status: text('status').notNull().default('backlog'),
  priority: text('priority').notNull().default('medium'),
  reporterId: uuid('reporter_id').notNull(),
  assigneeId: uuid('assignee_id'),
  dueDate: date('due_date'),
  position: numeric('position').notNull().default('0'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [unique('issues_project_id_issue_number_unique').on(t.projectId, t.issueNumber), index('issues_project_status_idx').on(t.projectId, t.status), index('issues_assignee_id_idx').on(t.assigneeId)]);
export const issueComments = pgTable('issue_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  issueId: uuid('issue_id').notNull(),
  authorId: uuid('author_id').notNull(),
  body: text('body').notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index('issue_comments_issue_id_idx').on(t.issueId)]);
export const labels = pgTable('labels', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#64748b'),
  createdAt: createdAt(),
}, (t) => [unique('labels_project_id_name_unique').on(t.projectId, t.name), index('labels_project_id_idx').on(t.projectId)]);
export const issueLabels = pgTable('issue_labels', {
  issueId: uuid('issue_id').notNull(),
  labelId: uuid('label_id').notNull(),
}, (t) => [primaryKey({ columns: [t.issueId, t.labelId] })]);
