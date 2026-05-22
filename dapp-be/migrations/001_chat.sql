CREATE TABLE IF NOT EXISTS chat_conversations (
    id TEXT PRIMARY KEY,
    listing_id INTEGER REFERENCES documents(id) ON DELETE CASCADE,
    buyer_wallet_address VARCHAR(255) NOT NULL,
    seller_wallet_address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_wallet_address VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_conversations_unique
    ON chat_conversations(listing_id, buyer_wallet_address, seller_wallet_address);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_listing ON chat_conversations(listing_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_buyer ON chat_conversations(buyer_wallet_address);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_seller ON chat_conversations(seller_wallet_address);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);
