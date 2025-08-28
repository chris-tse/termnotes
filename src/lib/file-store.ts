import { Clock, Effect } from "effect";
import { FileSystem } from "@effect/platform";
import { Config } from "./config";
import { parseDocument, renderDocument, type Document } from "./document";

export class FileStore extends Effect.Service<FileStore>()("tn/FileStore", {
  effect: Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const { getConfig } = yield* Config;

    const ensureTodayFile = Effect.gen(function* () {
      const config = yield* getConfig;
      yield* fs.makeDirectory(config.notesDir, { recursive: true });

      const nowMs = yield* Clock.currentTimeMillis;
      const now = new Date(nowMs);
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const dd = String(now.getDate()).padStart(2, "0");
      const filePath = `${config.notesDir}/${yyyy}-${mm}-${dd}.md`;

      if (!(yield* fs.exists(filePath))) {
        yield* fs.writeFileString(filePath, "## Tasks\n\n## Notes\n");
      }
      return filePath;
    });

    const loadTodayDocument = Effect.gen(function* () {
      const path = yield* ensureTodayFile;
      const text = yield* fs.readFileString(path);
      const doc = yield* parseDocument(text);
      return { path, doc } as const;
    });

    const saveDocument = (path: string, doc: Document) =>
      Effect.gen(function* () {
        const content = yield* renderDocument(doc);
        return yield* fs.writeFileString(path, content);
      });

    return { ensureTodayFile, loadTodayDocument, saveDocument } as const;
  }),
}) {}
