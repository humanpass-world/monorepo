import { OpenAPIRoute } from "chanfana";
import { z } from "zod";
import type { AppContext } from "workers/types";
import { randomUUID } from "crypto";
import { getPublicUrl } from "workers/utils/cdn";

export class UploadFile extends OpenAPIRoute {
  schema = {
    tags: ["Common"],
    summary: "Upload file",
    security: [{ cookie: [] }],
    request: {
      body: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: z.object({
              file: z
                .custom<File>((v) => v instanceof File)
                .openapi({
                  type: "string",
                  format: "binary",
                }),
            }),
          },
        },
      },
    },
    responses: {
      "200": {
        description: "Success",
        content: {
          "application/json": {
            schema: z.object({
              path: z.string(),
              publicUrl: z.string(),
            }),
          },
        },
      },
      "401": {
        description: "Unauthorized - Authentication required",
        content: {
          "application/json": {
            schema: z.object({
              code: z.literal("UNAUTHORIZED"),
              error: z.string(),
            }),
          },
        },
      },
    },
  };

  async handle(c: AppContext) {
    const fd = await c.req.formData(); // Hono/Fetch API
    const rawFile = fd.get("file");
    if (rawFile && !(rawFile instanceof File)) {
      return c.json({ error: "file must be a file" }, 400);
    }

    let path: string | null = null;
    if (rawFile) {
      const file = rawFile as File;
      const uploadResult = await c.env.UPLOAD_BUCKET.put(
        `${randomUUID()}.${file.type.split("/")[1]}`,
        file
      );
      if (uploadResult) {
        path = uploadResult.key;
      }
    }

    return {
      path: path,
      publicUrl: getPublicUrl(path),
    };
  }
}
