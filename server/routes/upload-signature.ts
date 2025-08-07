import { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { Buffer } from "buffer";

// TODO: Move these to environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const SUPABASE_KEY = process.env.SUPABASE_KEY || "YOUR_SUPABASE_KEY";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper to convert data URL to blob
const dataUrlToBuffer = (dataUrl: string) => {
  const base64 = dataUrl.split(",")[1];
  if (!base64) {
    throw new Error("Invalid data URL");
  }
  return Buffer.from(base64, "base64");
};

export const handleUploadSignature: RequestHandler = async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ message: "Image data is required" });
  }

  try {
    const buffer = dataUrlToBuffer(image);
    const fileName = `signatures/${Date.now()}.png`;

    const { data, error } = await supabase.storage
      .from("signatures") // Assumes a 'signatures' bucket exists
      .upload(fileName, buffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("signatures")
      .getPublicUrl(fileName);

    if (!publicUrl) {
      throw new Error("Could not get public URL for uploaded file.");
    }

    res.status(200).json({ url: publicUrl });
  } catch (error: any) {
    console.error("Error uploading to Supabase:", error);
    res.status(500).json({
      message: "Failed to upload signature",
      error: error.message,
    });
  }
};
