import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { randomUUID } from "crypto";
import jwt from "jsonwebtoken";
import "./config/db";
import pool from "./config/db";
import authRoutes from "./routes/auth";
import documentRoutes from "./routes/documents";
import { startContractListener } from "./listeners/contractListener";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Middleware
app.use(
  cors({
    origin: CLIENT_ORIGIN,
  }),
);
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Server đang chạy!" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

type ChatMessage = {
  id: string;
  conversationId: string;
  listingId: string;
  senderAddress: string;
  senderName: string;
  message: string;
  timestamp: number;
};

type ChatThread = {
  conversationId: string;
  buyerAddress: string;
  lastMessage: string | null;
  lastTimestamp: number;
};

type SocketUser = {
  userId: number;
  wallet_address: string;
};

const MAX_MESSAGES = 200;

const getRoomKey = (conversationId: string) => `conversation:${conversationId}`;
const getListingRoomKey = (listingId: number) => `listing:${listingId}`;
const normalizeAddress = (value?: string) => value?.trim().toLowerCase();
const toTimestamp = (value?: string | null) =>
  value ? new Date(value).getTime() : Date.now();

const getSocketToken = (socket: {
  handshake: { auth?: any; headers?: any };
}) => {
  const authToken = socket.handshake?.auth?.token;
  if (typeof authToken === "string" && authToken.trim())
    return authToken.trim();

  const header = socket.handshake?.headers?.authorization;
  if (typeof header !== "string") return undefined;
  const parts = header.trim().split(" ").filter(Boolean);
  const scheme = parts[0]?.toLowerCase();
  if (parts.length === 1) return parts[0];
  if (scheme === "bearer" || scheme === "jwt" || scheme === "token")
    return parts[1];
  return parts[1];
};

const getConversation = async (conversationId: string) => {
  const result = await pool.query(
    `SELECT id, listing_id, buyer_wallet_address, seller_wallet_address
         FROM chat_conversations
         WHERE id = $1`,
    [conversationId],
  );
  return result.rows[0] ?? null;
};

const getOrCreateConversation = async (
  listingId: number,
  buyerAddress: string,
  sellerAddress: string,
) => {
  const existing = await pool.query(
    `SELECT id FROM chat_conversations
         WHERE listing_id = $1 AND buyer_wallet_address = $2 AND seller_wallet_address = $3
         LIMIT 1`,
    [listingId, buyerAddress, sellerAddress],
  );
  if (existing.rows[0]?.id) return String(existing.rows[0].id);

  const id = randomUUID();
  await pool.query(
    `INSERT INTO chat_conversations
            (id, listing_id, buyer_wallet_address, seller_wallet_address)
         VALUES ($1, $2, $3, $4)`,
    [id, listingId, buyerAddress, sellerAddress],
  );
  return id;
};

const loadChatHistory = async (conversationId: string) => {
  const result = await pool.query(
    `SELECT id, conversation_id, sender_wallet_address, sender_name, message, created_at
         FROM chat_messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC
         LIMIT $2`,
    [conversationId, MAX_MESSAGES],
  );
  return result.rows.map((row: any) => ({
    id: String(row.id),
    conversationId: String(row.conversation_id),
    listingId: "",
    senderAddress: String(row.sender_wallet_address),
    senderName: String(row.sender_name ?? ""),
    message: String(row.message ?? ""),
    timestamp: toTimestamp(row.created_at),
  }));
};

const loadThreadsForSeller = async (
  listingId: number,
  sellerAddress: string,
) => {
  const result = await pool.query(
    `SELECT c.id AS conversation_id,
                c.buyer_wallet_address,
                COALESCE(m.message, '') AS last_message,
                COALESCE(m.created_at, c.created_at) AS last_timestamp
         FROM chat_conversations c
         LEFT JOIN LATERAL (
             SELECT message, created_at
             FROM chat_messages
             WHERE conversation_id = c.id
             ORDER BY created_at DESC
             LIMIT 1
         ) m ON true
         WHERE c.listing_id = $1 AND c.seller_wallet_address = $2
         ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
    [listingId, sellerAddress],
  );
  return result.rows.map((row: any) => ({
    conversationId: String(row.conversation_id),
    buyerAddress: String(row.buyer_wallet_address),
    lastMessage: String(row.last_message ?? ""),
    lastTimestamp: toTimestamp(row.last_timestamp),
  }));
};

io.use((socket, next) => {
  const token = getSocketToken(socket);
  if (!token) return next(new Error("unauthorized"));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    (socket.data as any).user = decoded;
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});

io.on("connection", (socket) => {
  socket.on("chat:listing-join", async (payload: { listingId?: string }) => {
    try {
      const listingId = Number(payload?.listingId);
      if (!Number.isFinite(listingId)) return;

      const user = (socket.data as any).user as SocketUser | undefined;
      const walletAddress = normalizeAddress(user?.wallet_address);
      if (!walletAddress) return;

      const docResult = await pool.query(
        "SELECT owner_address FROM documents WHERE id = $1",
        [listingId],
      );
      const sellerAddress = normalizeAddress(docResult.rows[0]?.owner_address);
      if (!sellerAddress || sellerAddress !== walletAddress) return;

      socket.join(getListingRoomKey(listingId));
    } catch (error) {
      console.error("Lỗi chat:listing-join:", error);
    }
  });

  socket.on("chat:threads", async (payload: { listingId?: string }) => {
    try {
      const listingId = Number(payload?.listingId);
      if (!Number.isFinite(listingId)) return;

      const user = (socket.data as any).user as SocketUser | undefined;
      const walletAddress = normalizeAddress(user?.wallet_address);
      if (!walletAddress) return;

      const docResult = await pool.query(
        "SELECT owner_address FROM documents WHERE id = $1",
        [listingId],
      );
      const sellerAddress = normalizeAddress(docResult.rows[0]?.owner_address);
      if (!sellerAddress || sellerAddress !== walletAddress) return;

      const threads = await loadThreadsForSeller(listingId, sellerAddress);
      socket.emit("chat:threads", threads);
    } catch (error) {
      console.error("Lỗi chat:threads:", error);
    }
  });

  socket.on(
    "chat:join",
    async (payload: { listingId?: string; buyerAddress?: string }) => {
      try {
        const listingId = Number(payload?.listingId);
        if (!Number.isFinite(listingId)) return;

        const user = (socket.data as any).user as SocketUser | undefined;
        const walletAddress = normalizeAddress(user?.wallet_address);
        if (!walletAddress) return;

        const docResult = await pool.query(
          "SELECT owner_address FROM documents WHERE id = $1",
          [listingId],
        );
        const sellerAddress = normalizeAddress(
          docResult.rows[0]?.owner_address,
        );
        if (!sellerAddress) return;

        let buyerAddress = walletAddress;
        if (walletAddress === sellerAddress) {
          buyerAddress = normalizeAddress(payload?.buyerAddress) ?? "";
          if (!buyerAddress || buyerAddress === sellerAddress) return;
        }

        const conversationId = await getOrCreateConversation(
          listingId,
          buyerAddress,
          sellerAddress,
        );

        socket.data.conversationId = conversationId;
        socket.data.listingId = listingId;
        socket.data.buyerAddress = buyerAddress;
        socket.data.sellerAddress = sellerAddress;

        const room = getRoomKey(conversationId);
        socket.join(room);

        const history = await loadChatHistory(conversationId);
        socket.emit("chat:ready", {
          conversationId,
          buyerAddress,
          sellerAddress,
        });
        socket.emit(
          "chat:history",
          history.map((entry) => ({
            ...entry,
            listingId: String(listingId),
          })),
        );
      } catch (error) {
        console.error("Lỗi chat:join:", error);
      }
    },
  );

  socket.on(
    "chat:message",
    async (payload: {
      conversationId?: string;
      senderName?: string;
      message?: string;
    }) => {
      try {
        const conversationId = String(
          payload?.conversationId ?? socket.data.conversationId ?? "",
        );
        const message = payload?.message?.trim();
        if (!conversationId || !message) return;

        const user = (socket.data as any).user as SocketUser | undefined;
        const senderAddress = normalizeAddress(user?.wallet_address);
        if (!senderAddress) return;

        const conversation = await getConversation(conversationId);
        if (!conversation) return;

        const buyerAddress = normalizeAddress(
          conversation.buyer_wallet_address,
        );
        const sellerAddress = normalizeAddress(
          conversation.seller_wallet_address,
        );
        if (senderAddress !== buyerAddress && senderAddress !== sellerAddress)
          return;

        const senderName = payload?.senderName?.trim() || "Anonymous";
        const entry: ChatMessage = {
          id: randomUUID(),
          conversationId,
          listingId: String(conversation.listing_id),
          senderAddress,
          senderName,
          message,
          timestamp: Date.now(),
        };

        await pool.query(
          `INSERT INTO chat_messages
                    (id, conversation_id, sender_wallet_address, sender_name, message)
                 VALUES ($1, $2, $3, $4, $5)`,
          [entry.id, conversationId, senderAddress, senderName, message],
        );

        const room = getRoomKey(conversationId);
        io.to(room).emit("chat:message", entry);

        const listingRoom = getListingRoomKey(Number(conversation.listing_id));
        io.to(listingRoom).emit("chat:notify", {
          conversationId,
          listingId: String(conversation.listing_id),
          buyerAddress,
          sellerAddress,
          message,
          timestamp: entry.timestamp,
        });
      } catch (error) {
        console.error("Lỗi chat:message:", error);
      }
    },
  );
});

server.listen(PORT, () => {
  console.log(`Server chạy ở http://localhost:${PORT}`);
  void startContractListener();
});
