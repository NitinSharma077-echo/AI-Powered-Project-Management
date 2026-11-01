const mongoose = require("mongoose");
const crypto = require("crypto");
const dotenv = require("dotenv");

const User = require("../Models/user");
const connectDatabase = require("../config/db");

dotenv.config();

// Hash a plaintext password using Node's built-in scrypt (no extra dependency).
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

// Create a new developer user, or return the existing one with that email.
async function createDevUser({ name, email, password }) {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    console.log(`User with email ${email} already exists.`);
    return existingUser;
  }

  const newUser = await User.create({
    name,
    email,
    passwordHash: hashPassword(password),
    role: "user"
  });

  console.log(`Developer user created with email ${email}.`);
  return newUser;
}

async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: node create-dev-user.js <email> <password> [name]");
    process.exitCode = 1;
    return;
  }

  try {
    await connectDatabase();
    await createDevUser({ name: name || "Dev User", email, password });
  } catch (error) {
    console.error("Error creating developer user:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();
