import z from "zod";

export const signupSchema = {
    body: z.object({
        email:z.email(), password:z.string().min(8).max(50)
    })
}

export const loginSchema = {
    body: z.object({
        email:z.email(), password:z.string().min(8).max(50)
    })
}