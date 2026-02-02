'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserCog, Plus, Edit2, UserCheck, UserX } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Profile, UserRole } from '@/lib/types/database'

const roleLabels: Record<UserRole, string> = {
  admin: 'Administrator',
  uploader: 'Uploader',
  user: 'Gebruiker',
}

const roleBadgeColors: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800',
  uploader: 'bg-blue-100 text-blue-800',
  user: 'bg-gray-100 text-gray-800',
}

export default function GebruikersPage() {
  const [users, setUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Form state
  const [formEmail, setFormEmail] = useState('')
  const [formNaam, setFormNaam] = useState('')
  const [formRole, setFormRole] = useState<UserRole>('user')
  const [isSaving, setIsSaving] = useState(false)

  const supabase = createClient()

  const loadUsers = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email')

      if (error) {
        console.error('Error loading users:', error)
        toast.error('Fout bij laden gebruikers')
      } else {
        setUsers(data as Profile[])
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleEditUser = (user: Profile) => {
    setEditingUser(user)
    setFormEmail(user.email)
    setFormNaam(user.naam || '')
    setFormRole(user.role)
    setIsDialogOpen(true)
  }

  const handleNewUser = () => {
    setEditingUser(null)
    setFormEmail('')
    setFormNaam('')
    setFormRole('user')
    setIsDialogOpen(true)
  }

  const handleSaveUser = async () => {
    if (!formEmail) {
      toast.error('Email is verplicht')
      return
    }

    setIsSaving(true)

    try {
      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('profiles')
          .update({
            naam: formNaam || null,
            role: formRole,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingUser.id)

        if (error) throw error

        toast.success('Gebruiker bijgewerkt')
      } else {
        // For new user, we need to use Supabase Auth admin API
        // This requires service role key which is not available in browser
        toast.error('Nieuwe gebruikers kunnen alleen via Supabase Dashboard worden aangemaakt')
        setIsSaving(false)
        return
      }

      setIsDialogOpen(false)
      loadUsers()
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Fout bij opslaan')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleActive = async (user: Profile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          actief: !user.actief,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success(user.actief ? 'Gebruiker gedeactiveerd' : 'Gebruiker geactiveerd')
      loadUsers()
    } catch (error) {
      console.error('Toggle error:', error)
      toast.error('Fout bij wijzigen status')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Gebruikersbeheer
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewUser}>
                <Plus className="mr-2 h-4 w-4" />
                Nieuwe gebruiker
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Gebruiker bewerken' : 'Nieuwe gebruiker'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    disabled={!!editingUser}
                    placeholder="gebruiker@email.nl"
                  />
                  {!editingUser && (
                    <p className="text-xs text-gray-500">
                      Nieuwe gebruikers moeten via Supabase Dashboard worden aangemaakt.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="naam">Naam</Label>
                  <Input
                    id="naam"
                    value={formNaam}
                    onChange={(e) => setFormNaam(e.target.value)}
                    placeholder="Volledige naam"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rol</Label>
                  <Select value={formRole} onValueChange={(v) => setFormRole(v as UserRole)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Gebruiker - Alleen lezen</SelectItem>
                      <SelectItem value="uploader">Uploader - Kan CSV importeren</SelectItem>
                      <SelectItem value="admin">Administrator - Volledige toegang</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={isSaving}
                  >
                    Annuleren
                  </Button>
                  <Button onClick={handleSaveUser} disabled={isSaving || !editingUser}>
                    {isSaving ? 'Opslaan...' : 'Opslaan'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <UserCog className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Geen gebruikers gevonden
              </h3>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Naam</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aangemaakt</TableHead>
                  <TableHead className="text-right">Acties</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.naam || '-'}</TableCell>
                    <TableCell>
                      <Badge className={roleBadgeColors[user.role]}>
                        {roleLabels[user.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.actief ? (
                        <Badge className="bg-green-100 text-green-800">
                          <UserCheck className="mr-1 h-3 w-3" />
                          Actief
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <UserX className="mr-1 h-3 w-3" />
                          Inactief
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {formatDateTime(user.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user)}
                        >
                          {user.actief ? (
                            <UserX className="h-4 w-4 text-red-500" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
