-- Migration to add pinned message column to campaign chat messages table
ALTER TABLE campaign_chat_messages ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT FALSE;
