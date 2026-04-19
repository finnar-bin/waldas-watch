import { supabase } from "./supabase-client";

export type SheetMember = {
  id: string;
  userId: string;
  role: "viewer" | "editor" | "admin";
  displayName: string | null;
  email: string | null;
  avatarUrl: string | null;
};

export type SheetInvite = {
  id: string;
  invitedEmail: string;
  role: "viewer" | "editor" | "admin";
  expiresAt: string;
  tokenHash: string;
};

export type InviteUserInput = {
  sheetId: string;
  invitedEmail: string;
  role: "viewer" | "editor" | "admin";
  invitedBy: string;
};

export type InviteResult = {
  inviteUrl: string;
};

async function hashToken(token: string): Promise<string> {
  const encoded = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getSheetMembers(sheetId: string): Promise<SheetMember[]> {
  const { data: sheetUsers, error: sheetUsersError } = await supabase
    .from("sheet_users")
    .select("id, user_id, role")
    .eq("sheet_id", sheetId)
    .order("created_at", { ascending: true });

  if (sheetUsersError) throw sheetUsersError;
  if (!sheetUsers?.length) return [];

  const userIds = sheetUsers.map((u) => u.user_id);

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name, email, avatar_url")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  type ProfileRow = {
    id: string;
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p as ProfileRow]),
  );

  return sheetUsers.map((row) => {
    const profile = profileMap.get(row.user_id);
    return {
      id: row.id,
      userId: row.user_id,
      role: row.role as SheetMember["role"],
      displayName: profile?.display_name ?? null,
      email: profile?.email ?? null,
      avatarUrl: profile?.avatar_url ?? null,
    };
  });
}

export async function getSheetInvites(sheetId: string): Promise<SheetInvite[]> {
  const { data, error } = await supabase
    .from("sheet_invites")
    .select("id, invited_email, role, expires_at, token_hash")
    .eq("sheet_id", sheetId)
    .eq("status", "pending")
    .order("expires_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    invitedEmail: row.invited_email,
    role: row.role as SheetInvite["role"],
    expiresAt: row.expires_at,
    tokenHash: row.token_hash,
  }));
}

export async function inviteUser(
  input: InviteUserInput,
): Promise<InviteResult> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", input.invitedEmail)
    .maybeSingle();

  if (profile) {
    const { data: existingMember } = await supabase
      .from("sheet_users")
      .select("id")
      .eq("sheet_id", input.sheetId)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (existingMember)
      throw new Error("This user is already a member of this sheet.");
  }

  const { data: pendingInvite } = await supabase
    .from("sheet_invites")
    .select("id")
    .eq("sheet_id", input.sheetId)
    .eq("invited_email", input.invitedEmail)
    .eq("status", "pending")
    .maybeSingle();

  const tokenHash = await hashToken(crypto.randomUUID());
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  if (pendingInvite) {
    const { error } = await supabase
      .from("sheet_invites")
      .update({
        role: input.role,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        invited_by: input.invitedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingInvite.id);

    if (error) throw error;
  } else {
    const { error } = await supabase.from("sheet_invites").insert({
      sheet_id: input.sheetId,
      invited_email: input.invitedEmail,
      role: input.role,
      token_hash: tokenHash,
      status: "pending",
      invited_by: input.invitedBy,
      expires_at: expiresAt.toISOString(),
    });

    if (error) throw error;
  }

  return {
    inviteUrl: `${window.location.origin}/invite/${tokenHash}`,
  };
}

export type InviteDetail = {
  id: string;
  sheetId: string;
  sheetName: string;
  invitedEmail: string;
  role: "viewer" | "editor" | "admin";
  status: "pending" | "accepted" | "declined" | "revoked" | "expired";
  expiresAt: string;
};

export async function getInviteByToken(
  tokenHash: string,
): Promise<InviteDetail | null> {
  const { data, error } = await supabase.functions.invoke<InviteDetail | null>(
    "get-invite",
    { body: { tokenHash } },
  );
  if (error) throw error;
  return data;
}

export async function acceptInvite(tokenHash: string): Promise<{ sheetId: string }> {
  const { data, error } = await supabase.functions.invoke<{ sheetId: string }>(
    "accept-invite",
    { body: { tokenHash } },
  );
  if (error) throw error;
  return data!;
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from("sheet_invites")
    .update({ status: "revoked" })
    .eq("id", inviteId);

  if (error) throw error;
}

export async function removeSheetMember(sheetUserId: string): Promise<void> {
  const { error } = await supabase
    .from("sheet_users")
    .delete()
    .eq("id", sheetUserId);
  if (error) throw error;
}

export type UserInvite = {
  id: string;
  sheetId: string;
  sheetName: string;
  role: "viewer" | "editor" | "admin";
  expiresAt: string;
  tokenHash: string;
  invitedByName: string | null;
};

export async function getUserInvites(email: string): Promise<UserInvite[]> {
  const { data, error } = await supabase
    .from("sheet_invites")
    .select("id, role, expires_at, token_hash, sheets(id, name), inviter:profiles!invited_by(display_name, email)")
    .eq("invited_email", email)
    .eq("status", "pending")
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const sheet = row.sheets as { id: string; name: string } | null;
    const inviter = row.inviter as { display_name: string | null; email: string | null } | null;
    return {
      id: row.id,
      sheetId: sheet?.id ?? "",
      sheetName: sheet?.name ?? "",
      role: row.role as UserInvite["role"],
      expiresAt: row.expires_at,
      tokenHash: row.token_hash,
      invitedByName: inviter?.display_name ?? inviter?.email ?? null,
    };
  });
}

export async function declineInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from("sheet_invites")
    .update({ status: "declined" })
    .eq("id", inviteId);

  if (error) throw error;
}
