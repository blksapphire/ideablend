-- Add indexes for the foreign keys and hot query paths (project detail,
-- browse, notifications, chat history, agent conversations). Without these
-- Postgres falls back to sequential scans as data grows.
CREATE INDEX IF NOT EXISTS "User_openToProjects_idx" ON "User"("openToProjects");
CREATE INDEX IF NOT EXISTS "Project_ownerId_idx" ON "Project"("ownerId");
CREATE INDEX IF NOT EXISTS "Project_status_visibility_idx" ON "Project"("status", "visibility");
CREATE INDEX IF NOT EXISTS "Project_createdAt_idx" ON "Project"("createdAt");
CREATE INDEX IF NOT EXISTS "ProjectFile_projectId_idx" ON "ProjectFile"("projectId");
CREATE INDEX IF NOT EXISTS "Role_projectId_idx" ON "Role"("projectId");
CREATE INDEX IF NOT EXISTS "Application_projectId_idx" ON "Application"("projectId");
CREATE INDEX IF NOT EXISTS "Application_userId_idx" ON "Application"("userId");
CREATE INDEX IF NOT EXISTS "Membership_projectId_idx" ON "Membership"("projectId");
CREATE INDEX IF NOT EXISTS "Membership_userId_idx" ON "Membership"("userId");
CREATE INDEX IF NOT EXISTS "Task_projectId_idx" ON "Task"("projectId");
CREATE INDEX IF NOT EXISTS "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX IF NOT EXISTS "Message_projectId_createdAt_idx" ON "Message"("projectId", "createdAt");
CREATE INDEX IF NOT EXISTS "Review_projectId_idx" ON "Review"("projectId");
CREATE INDEX IF NOT EXISTS "Review_revieweeId_idx" ON "Review"("revieweeId");
CREATE INDEX IF NOT EXISTS "Milestone_projectId_idx" ON "Milestone"("projectId");
CREATE INDEX IF NOT EXISTS "Activity_projectId_createdAt_idx" ON "Activity"("projectId", "createdAt");
CREATE INDEX IF NOT EXISTS "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "Follow_followingId_idx" ON "Follow"("followingId");
CREATE INDEX IF NOT EXISTS "PushSubscription_userId_idx" ON "PushSubscription"("userId");
CREATE INDEX IF NOT EXISTS "AgentConversation_userId_updatedAt_idx" ON "AgentConversation"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "AgentMessage_conversationId_createdAt_idx" ON "AgentMessage"("conversationId", "createdAt");
CREATE INDEX IF NOT EXISTS "AgentToolCall_messageId_idx" ON "AgentToolCall"("messageId");
