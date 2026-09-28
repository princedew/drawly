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

export const createRoomSchema = {
    body: z.object({
        name: z.string().trim().min(1).max(80),
    }),
};

export const deleteRoomSchema = {
    params: z.object({
        roomId: z.coerce.number().int().positive(),
    }),
};

export const joinRoomSchema = {
    params: z.object({
        roomId: z.coerce.number().int().positive(),
    }),
};

export const leaveRoomSchema = {
    params: z.object({
        roomId: z.coerce.number().int().positive(),
    }),
};