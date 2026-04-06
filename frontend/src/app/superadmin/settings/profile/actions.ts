"use server";

import { cookies } from "next/headers";
import { verifyAccessToken } from "@/lib/modules/auth/jwt";
import { db } from "@/lib/modules/core/db/mysql";
import { users, profiles } from "@/lib/modules/core/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auditService } from "@/lib/modules/audit/audit.service";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  language: z.string().min(2).max(10),
  avatarUrl: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("sb-access-token")?.value;

  if (!token) throw new Error("Unauthorized");

  try {
    const decoded = await verifyAccessToken(token);
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.sub))
      .limit(1);

    if (!userRows[0]) throw new Error("User not found");
    
    const profileRows = await db
        .select()
        .from(profiles)
        .where(eq(profiles.userId, decoded.sub))
        .limit(1);

    return {
        user: userRows[0],
        profile: profileRows[0],
    };
  } catch (err) {
    throw new Error("Unauthorized");
  }
}

export async function updateProfile(formData: z.infer<typeof profileSchema>) {
  try {
    const { user, profile } = await getAuthenticatedUser();
    const validatedData = profileSchema.parse(formData);

    const before = { ...user };

    await db.update(users)
      .set({
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        bio: validatedData.bio,
        language: validatedData.language,
        avatarUrl: validatedData.avatarUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await auditService.log({
      actor: user.id,
      actor_role: profile.role as any,
      action: "profile.updated",
      entity: user.id,
      clientId: profile.clientId ?? undefined,
      before,
      after: validatedData,
    });

    revalidatePath("/superadmin/settings/profile");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updatePassword(formData: z.infer<typeof passwordSchema>) {
  try {
    const { user, profile } = await getAuthenticatedUser();
    const validatedData = passwordSchema.parse(formData);

    const isMatch = await bcrypt.compare(validatedData.currentPassword, user.passwordHash);
    if (!isMatch) throw new Error("Incorrect current password");

    const newHash = await bcrypt.hash(validatedData.newPassword, 12);

    await db.update(users)
      .set({
        passwordHash: newHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    await auditService.log({
      actor: user.id,
      actor_role: profile.role as any,
      action: "profile.password_updated",
      entity: user.id,
      clientId: profile.clientId ?? undefined,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function uploadAvatar(formData: FormData) {
  try {
    const { user } = await getAuthenticatedUser();
    const file = formData.get("file") as File;
    if (!file) throw new Error("No file uploaded");

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${user.id}-${Date.now()}${path.extname(file.name)}`;
    const fullPath = path.join(uploadDir, filename);
    const relativeUrl = `/uploads/avatars/${filename}`;

    await writeFile(fullPath, buffer);

    await db.update(users)
      .set({ avatarUrl: relativeUrl, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    // Revalidate the profile path
    revalidatePath("/superadmin/settings/profile");

    return { success: true, url: relativeUrl };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function getProfile() {
    try {
        const { user, profile } = await getAuthenticatedUser();
        return {
            success: true,
            data: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                bio: user.bio,
                language: user.language,
                avatarUrl: user.avatarUrl,
                role: profile.role,
            }
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}
