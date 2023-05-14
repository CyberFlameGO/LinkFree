import { authOptions } from "../../auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import connectMongo from "@config/mongo";
import logger from "@config/logger";
import Profile from "@models/Profile";
import { getUserApi } from "pages/api/users/[username]";

export default async function handler(req, res) {
  if (req.method !== "PUT") {
    return res.status(400).json({ error: "Invalid request: PUT required" });
  }

  const session = await getServerSession(req, res, authOptions);
  const username = session.username;

  await connectMongo();
  const log = logger.child({ username });

  try {
    await Profile.findOneAndUpdate(
      { username },
      {
        source: req.body.source,
        name: req.body.name,
        bio: req.body.bio,
      },
      { upsert: true }
    );
    log.info(`profile created for username: ${username}`);
  } catch (e) {
    log.error(e, `failed to create profile stats for username: ${username}`);
  }

  const { status, profile } = await getUserApi(req, res, username);
  return res.status(status).json(profile);
}
