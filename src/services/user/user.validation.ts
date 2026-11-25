import { z } from "zod";

const updateProfileZodSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(10).optional(),
  }),
});

const updateUserStatusZodSchema = z.object({
  body: z.object({
    status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED", "HOLD", "SUSPENDED"], {
      required_error: "Status must be one of: ACTIVE, INACTIVE, BLOCKED, HOLD, SUSPENDED",
    }),
  }),
});

export const UserValidation = {
  updateProfileZodSchema,
  updateUserStatusZodSchema,
};

export default UserValidation;
