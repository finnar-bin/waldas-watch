import { supabase } from './supabase-client'

export type SheetMember = {
  id: string
  userId: string
  role: 'viewer' | 'editor' | 'admin'
  displayName: string | null
  email: string | null
}

export type SheetInvite = {
  id: string
  invitedEmail: string
  role: 'viewer' | 'editor' | 'admin'
  expiresAt: string
}

export type InviteUserInput = {
  sheetId: string
  invitedEmail: string
  role: 'viewer' | 'editor' | 'admin'
  invitedBy: string
}

export type InviteResult = {
  inviteUrl: string
}

async function hashToken(token: string): Promise<string> {
  const encoded = new TextEncoder().encode(token)
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function getSheetMembers(sheetId: string): Promise<SheetMember[]> {
  const { data, error } = await supabase
    .from('sheet_users')
    .select('id, user_id, role, profiles(display_name, email)')
    .eq('sheet_id', sheetId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => {
    const profile = row.profiles as unknown as { display_name: string | null; email: string | null } | null

    return {
      id: row.id,
      userId: row.user_id,
      role: row.role as SheetMember['role'],
      displayName: profile?.display_name ?? null,
      email: profile?.email ?? null,
    }
  })
}

export async function getSheetInvites(sheetId: string): Promise<SheetInvite[]> {
  const { data, error } = await supabase
    .from('sheet_invites')
    .select('id, invited_email, role, expires_at')
    .eq('sheet_id', sheetId)
    .eq('status', 'pending')
    .order('expires_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id,
    invitedEmail: row.invited_email,
    role: row.role as SheetInvite['role'],
    expiresAt: row.expires_at,
  }))
}

export async function inviteUser(input: InviteUserInput): Promise<InviteResult> {
  const token = crypto.randomUUID()
  const tokenHash = await hashToken(token)

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await supabase.from('sheet_invites').insert({
    sheet_id: input.sheetId,
    invited_email: input.invitedEmail,
    role: input.role,
    token_hash: tokenHash,
    status: 'pending',
    invited_by: input.invitedBy,
    expires_at: expiresAt.toISOString(),
  })

  if (error) throw error

  return {
    inviteUrl: `${window.location.origin}/invite?token=${token}`,
  }
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('sheet_invites')
    .update({ status: 'revoked' })
    .eq('id', inviteId)

  if (error) throw error
}

export async function removeSheetMember(sheetUserId: string): Promise<void> {
  const { error } = await supabase.from('sheet_users').delete().eq('id', sheetUserId)
  if (error) throw error
}
