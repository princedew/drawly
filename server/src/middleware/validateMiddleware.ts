import type { NextFunction, Request, Response } from "express";
import z from "zod";
import { safeParseAsync } from "zod";

type Key = "body" | "params" | "query";

type Issue = Partial<Record<Key, z.core.$ZodIssue[]>>;

type SchemaObjectArrayType = [Key, z.ZodType][];

export const validate = (schemaObj: Partial<Record<Key, z.ZodType>>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const issues: Issue = {};
    for (const [key, schema] of Object.entries(
      schemaObj,
    ) as SchemaObjectArrayType) {
      const result = await schema.safeParseAsync(req[key]);
      if (!result.success) {
        return (issues[key] = result.error.issues);
      }
    }
    if (Object.keys(issues).length > 0) {
      console.log("issues:", issues);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: issues,
      });
    } else {
      next();
    }
  };
};
