import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, Fields, Files, File } from "formidable";
import mammoth from "mammoth";

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: NextApiRequest): Promise<{ fields: Fields; files: Files }> => {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ multiples: false });
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed." });
    return;
  }
  try {
    const { files } = await parseForm(req);
    const file = files.file?.[0] as File;
    if (!file) {
      res.status(400).json({ error: "No file uploaded." });
      return;
    }

    if (!file.filepath) {
      res.status(400).json({ error: "File path not found." });
      return;
    }

    const result = await mammoth.extractRawText({ path: file.filepath });
    let text = result.value;
    text = text.replace(/\n+/g, "\n");
    // text = text.replace(/\s+$/, "");

    const dayPattern = /(\d+)\.\s*([\s\S]*?)(?=\n\s*\d+\.\s*|$)/g;
    const matches = [...text.matchAll(dayPattern)];

    const devotionals = matches.map(match => ({
      day: Number(match[1]),
      content: match[2].trim(),
      image: null,
    }));

    
    res.status(200).json(devotionals);
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Error processing the file." });
  }
}
