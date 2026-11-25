import { z } from "zod";

const signupZodSchema = z
  .object({
    body: z.object({
      name: z.string({ required_error: "Name is required" }).min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address").optional().or(z.literal("")),
      phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal("")),
      password: z.string({ required_error: "Password is required" }).min(6, "Password must be at least 6 characters"),
      role: z.enum(["ADMIN", "CUSTOMER"]).optional(),
    }),
  })
  .refine(
    (data) => {
      const email = data.body.email?.trim();
      const phone = data.body.phone?.trim();
      return Boolean(email || phone);
    },
    {
      message: "At least one of Email or Phone Number is required to create an account",
      path: ["body", "email"],
    }
  );

const loginZodSchema = z.object({
  body: z.object({
    identifier: z.string({ required_error: "Email or Phone is required" }).min(1, "Identifier is required"),
    password: z.string({ required_error: "Password is required" }).min(1, "Password is required"),
  }),
});

const changePasswordZodSchema = z.object({
  body: z.object({
    oldPassword: z.string({ required_error: "Old password is required" }),
    newPassword: z.string({ required_error: "New password is required" }).min(6, "Password must be at least 6 characters"),
  }),
});

const sendOtpZodSchema = z.object({
  body: z.object({
    identifier: z.string({ required_error: "Email or Phone is required" }).min(1, "Identifier is required"),
  }),
});

const verifyOtpZodSchema = z.object({
  body: z.object({
    identifier: z.string({ required_error: "Email or Phone is required" }),
    otp: z.string({ required_error: "OTP code is required" }).length(6, "OTP must be 6 digits"),
  }),
});

const resetPasswordZodSchema = z.object({
  body: z.object({
    identifier: z.string({ required_error: "Email or Phone is required" }),
    otp: z.string({ required_error: "OTP code is required" }).length(6, "OTP must be 6 digits"),
    newPassword: z.string({ required_error: "New password is required" }).min(6, "Password must be at least 6 characters"),
  }),
});

export const AuthValidation = {
  signupZodSchema,
  loginZodSchema,
  changePasswordZodSchema,
  sendOtpZodSchema,
  verifyOtpZodSchema,
  resetPasswordZodSchema,
};

export default AuthValidation;
