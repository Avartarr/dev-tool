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

    // const devotionals = matches.map(match => ({
    //   day: Number(match[1]),
    //   content: match[2].trim(),
    //   image: null,
    // }));

    const devotionals = matches.map(match => {
      const blockText = match[2].trim();
      const lines = blockText.split('\n').map(line => line.trim());
      const nonEmptyLines = lines.filter(line => line.length > 0);
    
      const title = nonEmptyLines[0];
    
      let scriptureReading = '';
      let focus = '';
      let memoryVerse = '';
      const contentLines: string[] = [];
      let furtherReading = '';
      const declarationLines: string[] = [];
    
      let currentSection = '';
    
      for (let i = 1; i < nonEmptyLines.length; i++) {
        const line = nonEmptyLines[i];
    
        if (line.startsWith('SCRIPTURE READING:')) {
          scriptureReading = line.replace('SCRIPTURE READING:', '').trim();
          currentSection = 'scriptureReading';
        } else if (line.startsWith('FOCUS:')) {
          focus = line.replace('FOCUS:', '').trim();
          currentSection = 'focus';
        } else if (line.startsWith('MEMORY VERSE:')) {
          memoryVerse = line.replace('MEMORY VERSE:', '').trim();
          currentSection = 'memoryVerse';
        } else if (line.startsWith('FURTHER READING:')) {
          furtherReading = line.replace('FURTHER READING:', '').trim();
          currentSection = 'furtherReading';
        } else if (line.startsWith('DECLARATION:')) {
          currentSection = 'declaration';
        } else {
          if (currentSection === 'memoryVerse') {
            contentLines.push(line);
          } else if (currentSection === 'declaration') {
            declarationLines.push(line);
          }
        }
      }
    
      const content = contentLines.join('\n');
      const declaration = declarationLines.join('\n');
    
      return {
        day: Number(match[1]),
        title,
        scriptureReading,
        focus,
        memoryVerse,
        content,
        furtherReading,
        declaration,
        image: null, // placeholder for an uploaded image
      };
    });
    

    res.status(200).json({ devotionals });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ error: "Error processing the file." });
  }
}
