const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
require("dotenv").config();
const cors = require("cors");

const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.applicationDefault(), // or use `admin.credential.cert(serviceAccount)` if using a service account
  databaseURL: "https://aelon-7d5aa.firebaseio.com",
});

const db = admin.firestore();

// Initialize the Telegram bot with your Telegram API token
const token =
  process.env.TOKEN || "8150266495:AAFZmlYyPYInSPB9k4AHREV2NxE6uIjaIT0";
const bot = new TelegramBot(token, { polling: true });
bot.enableCancellation(); // Enable promise cancellation
console.log("Telegram Bot is running");

// Handle the /start command
bot.onText(/\/start/, (msg) => {
  console.log(`Received /start command from user: ${msg.chat.id}`);
  const chatId = msg.chat.id;

  const inlineKeyboard = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Open User Stats",
            web_app: {
              url: "https://d704-2405-201-e060-50-28fe-7712-cf8a-5baf.ngrok-free.app",
            },
          },
        ],
      ],
    },
  };

  bot
    .sendMessage(
      chatId,
      "Welcome! Click the button below to check your stats.",
      inlineKeyboard
    )
    .then(() => {
      console.log(`Message sent to chat ID: ${chatId}`);
    })
    .catch((error) => {
      console.error("Error sending message:", error);
    });
});

// Create an Express app
const app = express();

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST"],
  credentials: true,
};

app.use(cors(corsOptions));

// Middleware to parse JSON requests
app.use(express.json());

const timeout = (ms) =>
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Request Timeout")), ms)
  );

app.get("/api/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  console.log(`Fetching user data for ID: ${userId}`);

  try {
    const userRef = db.collection("users").doc(userId);
    console.log(`Attempting to get user document...`);

    // Start the timer
    console.time("Get User Document");

    // Use Promise.race to implement a timeout
    const userDoc = await Promise.race([
      userRef.get(),
      timeout(9000), // 9 seconds timeout
    ]);

    // End the timer
    console.timeEnd("Get User Document");

    console.log(`User document retrieved: ${userDoc.exists}`);

    if (!userDoc.exists) {
      console.log(`User document does not exist, creating new user...`);
      await userRef.set({ xp: 0, gold: 0, level: 1 });
      console.log(`User document created for ID: ${userId}`);
      return res.json({ message: "User created", xp: 0, gold: 0, level: 1 });
    }

    const userData = userDoc.data();
    console.log(`User data fetched: ${JSON.stringify(userData)}`);
    res.json(userData);
  } catch (error) {
    console.error("Error fetching user data:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Start the server
const PORT = process.env.PORT; // Default to 3001 if PORT is not specified
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
