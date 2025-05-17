
'use client';

import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import { BookHeart, PlusCircle, Users, Search, Edit2, Trash2, MessageSquare, ArrowUpDown, Loader2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

import useRtdbList from '@/hooks/use-rtdb-list';
import type { FamilyMember, DiaryNote, SortOrder } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription as UIDescription } from '@/components/ui/alert';
import { useDebounce } from '@/hooks/use-debounce';
import { useSetMobileHeaderActions } from '@/components/layout/app-layout';
import { useAuth } from '@/context/AuthContext';

const DEFAULT_PLACEHOLDER_AVATAR = 'https://placehold.co/100x100.png';

const generateDiceBearAvatar = (seed: string) => {
  return `https://api.dicebear.com/9.x/miniavs/svg?seed=${encodeURIComponent(seed || 'defaultUser')}`;
};

const displayName = (member: FamilyMember | Omit<FamilyMember, 'id'> | Partial<FamilyMember>) => {
  if ('realName' in member && member.realName) {
    return member.customName || member.realName;
  }
  return "Member";
}
const avatarInitial = (member: FamilyMember | Omit<FamilyMember, 'id'> | Partial<FamilyMember>) => displayName(member).substring(0, 1).toUpperCase();

interface FamilyMemberFormProps {
  member?: FamilyMember;
  onSave: (memberData: Partial<Omit<FamilyMember, 'id'>>, id?: string) => void;
  onClose: () => void;
}

function FamilyMemberForm({ member, onSave, onClose }: FamilyMemberFormProps) {
  const [realName, setRealName] = useState(member?.realName || '');
  const [customName, setCustomName] = useState(member?.customName || '');
  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (member?.avatarUrl && member.avatarUrl !== DEFAULT_PLACEHOLDER_AVATAR) {
      return member.avatarUrl;
    }
    if (member?.realName) {
      return generateDiceBearAvatar(member.realName);
    }
    return '';
  });
  const { toast } = useToast();

  const handleSubmit = () => {
    const trimmedRealName = realName.trim();
    if (!trimmedRealName) {
      toast({ title: "Error", description: "Real name is required.", variant: "destructive" });
      return;
    }

    let finalAvatarUrl = avatarUrl.trim();
    if (!finalAvatarUrl || finalAvatarUrl === DEFAULT_PLACEHOLDER_AVATAR) {
      finalAvatarUrl = generateDiceBearAvatar(trimmedRealName);
    }

    const memberPayload: Partial<Omit<FamilyMember, 'id'>> = {
      realName: trimmedRealName,
      avatarUrl: finalAvatarUrl,
    };

    const trimmedCustomName = customName.trim();
    if (member && !trimmedCustomName) {
      memberPayload.customName = null; // Explicitly set to null to remove it in Firebase
    } else if (trimmedCustomName) {
      memberPayload.customName = trimmedCustomName;
    }


    onSave(memberPayload, member?.id);
  };

  useEffect(() => {
    // Auto-update to DiceBear avatar if realName changes and current avatar is placeholder or DiceBear
    if (!member || (member && (avatarUrl.startsWith('https://api.dicebear.com') || avatarUrl === DEFAULT_PLACEHOLDER_AVATAR || !avatarUrl))) {
      if (realName.trim()) {
        setAvatarUrl(generateDiceBearAvatar(realName.trim()));
      }
    }
  }, [realName, member, avatarUrl]);


  return (
    <>
      <DialogHeader>
        <DialogTitle>{member ? 'Edit' : 'Add'} Family Member</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="realName" className="text-right">Real Name</Label>
          <Input id="realName" value={realName} onChange={(e) => setRealName(e.target.value)} className="col-span-3" placeholder="e.g., John Doe" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="customName" className="text-right">Custom Name</Label>
          <Input id="customName" value={customName} onChange={(e) => setCustomName(e.target.value)} className="col-span-3" placeholder="e.g., Dad, Bestie (Optional)" />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="avatarUrl" className="text-right">Avatar URL</Label>
          <Input
            id="avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="col-span-3"
            placeholder="Leave blank for an auto-generated avatar"
          />
        </div>
         {avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')) && (
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="col-start-2 col-span-3">
              <img src={avatarUrl} alt="Avatar Preview" className="h-20 w-20 rounded-full object-cover border" data-ai-hint="cartoon avatar"/>
            </div>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Member</Button>
      </DialogFooter>
    </>
  );
}

interface DiaryNoteFormProps {
  familyMember: FamilyMember;
  onSave: (noteData: Omit<DiaryNote, 'id' | 'familyMemberId' | 'createdAt'>) => void;
  onClose: () => void;
}

function DiaryNoteForm({ familyMember, onSave, onClose }: DiaryNoteFormProps) {
  const [noteText, setNoteText] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!noteText.trim()) {
       toast({ title: "Error", description: "Note text cannot be empty.", variant: "destructive" });
      return;
    }
    onSave({
      noteText: noteText.trim(),
    });
  };

  return (
     <>
      <DialogHeader>
        <DialogTitle>Add Note for {displayName(familyMember)}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder={`What did ${displayName(familyMember)} say or how do you feel?`}
          rows={5}
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Note</Button>
      </DialogFooter>
    </>
  );
}

interface FamilyMemberDisplayCardProps {
  member: FamilyMember;
  onSelectMember: (member: FamilyMember) => void;
  onEditMember: (member: FamilyMember) => void;
  onDeleteMemberTrigger: (memberId: string, memberName: string) => void;
}

const FamilyMemberDisplayCard = memo(({ member, onSelectMember, onEditMember, onDeleteMemberTrigger }: FamilyMemberDisplayCardProps) => {
  const handleCardClick = useCallback(() => onSelectMember(member), [member, onSelectMember]);
  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEditMember(member);
  }, [member, onEditMember]);
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteMemberTrigger(member.id, displayName(member));
  },[member.id, member, onDeleteMemberTrigger]);

  const displayAvatarUrl =
    (member.avatarUrl && member.avatarUrl !== DEFAULT_PLACEHOLDER_AVATAR && member.avatarUrl.startsWith('http'))
    ? member.avatarUrl
    : generateDiceBearAvatar(member.realName);

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow duration-200 flex flex-col p-1 sm:p-2"
      onClick={handleCardClick}
      data-ai-hint="family member"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
    >
      <CardHeader className="items-center text-center p-1 sm:p-2">
        <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mb-1">
          <AvatarImage src={displayAvatarUrl} alt={displayName(member)} data-ai-hint="cartoon avatar" />
          <AvatarFallback>{avatarInitial(member)}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-xs sm:text-sm line-clamp-1">{displayName(member)}</CardTitle>
        {member.customName && <CardDescription className="text-[10px] sm:text-xs line-clamp-1">{member.realName}</CardDescription>}
      </CardHeader>
      <CardFooter className="flex justify-end gap-1 p-1 mt-auto border-t">
          <Button variant="ghost" size="icon" onClick={handleEditClick} aria-label={`Edit ${displayName(member)}`} className="h-6 w-6 sm:h-7 sm:w-7">
            <Edit2 className="h-3 w-3" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive h-6 w-6 sm:h-7 sm:w-7" onClick={handleDeleteClick} aria-label={`Delete ${displayName(member)}`}>
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Delete</span>
          </Button>
      </CardFooter>
    </Card>
  );
});
FamilyMemberDisplayCard.displayName = 'FamilyMemberDisplayCard';

interface DiaryNoteDisplayCardProps {
  note: DiaryNote;
  onDeleteNoteTrigger: (noteId: string) => void;
}

const DiaryNoteDisplayCard = memo(({ note, onDeleteNoteTrigger }: DiaryNoteDisplayCardProps) => {
  return (
    <Card className="shadow-md">
      <CardContent className="p-2 sm:p-3 md:p-4">
        <p className="whitespace-pre-wrap break-words text-sm">{note.noteText}</p>
        <div className="flex justify-between items-center mt-2 pt-2 sm:mt-3 sm:pt-3 border-t">
            <p className="text-xs text-muted-foreground">
            {format(new Date(note.createdAt), 'MMM d, yyyy HH:mm')}
            </p>
            <Button variant="ghost" size="sm" onClick={() => onDeleteNoteTrigger(note.id)} className="text-destructive hover:text-destructive text-xs">
                Delete
            </Button>
        </div>
      </CardContent>
    </Card>
  );
});
DiaryNoteDisplayCard.displayName = 'DiaryNoteDisplayCard';


export default function DiaryPage() {
  const { user } = useAuth();
  const {
    items: familyMembersFromDb,
    addItem: addFamilyMemberToDb,
    updateItem: updateFamilyMemberInDb,
    deleteItem: deleteFamilyMemberFromDb,
    loading: familyMembersLoading,
    error: familyMembersError
  } = useRtdbList<FamilyMember>(user ? 'familyMembers' : '');

  const {
    items: diaryNotes,
    addItem: addDiaryNoteToDb,
    deleteItem: deleteDiaryNoteFromDb,
    loading: diaryNotesLoading,
    error: diaryNotesError
  } = useRtdbList<DiaryNote>(user ? 'diaryNotes' : '');

  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);

  const [instantNoteSearchTerm, setInstantNoteSearchTerm] = useState('');
  const noteSearchTerm = useDebounce(instantNoteSearchTerm, 300);
  const [noteSortOrder, setNoteSortOrder] = useState<SortOrder>('newest');

  const [instantFamilySearchTerm, setInstantFamilySearchTerm] = useState('');
  const familySearchTerm = useDebounce(instantFamilySearchTerm, 300);

  const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<{id: string, name: string} | null>(null);
  const [showDeleteNoteDialog, setShowDeleteNoteDialog] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  const { toast } = useToast();
  const setMobileHeaderActions = useSetMobileHeaderActions();

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);
  
  const handleSaveMember = useCallback(async (memberData: Partial<Omit<FamilyMember, 'id'>>, id?: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      if (id) {
        const nameForToast = (memberData.realName || editingMember?.realName)
          ? displayName(memberData as Partial<FamilyMember>)
          : "Member";
        await updateFamilyMemberInDb(id, memberData);
        toast({ title: "Success!", description: `Family member ${nameForToast} updated.` });
      } else {
        if (!memberData.realName) {
            toast({ title: "Error", description: "Real name is required to add a member.", variant: "destructive" });
            return;
        }
        await addFamilyMemberToDb(memberData as Omit<FamilyMember, 'id'>);
        toast({ title: "Success!", description: `Family member ${displayName(memberData as Partial<FamilyMember>)} added.` });
      }
      setIsMemberFormOpen(false);
      setEditingMember(null);
    } catch (e: any) {
      let description = "Failed to save family member.";
      if (e && e.message) {
        description += ` Details: ${e.message.substring(0, 200)}${e.message.length > 200 ? '...' : ''}`;
      }
      toast({ title: "Database Error", description, variant: "destructive" });
      console.error("Failed to save family member. Error object:", e);
      if (e && e.code) {
        console.error("Firebase Error Code:", e.code);
      }
       if (e && e.stack) {
        console.error("Firebase Error Stack:", e.stack);
      }
    }
  }, [addFamilyMemberToDb, updateFamilyMemberInDb, toast, editingMember, user, setIsMemberFormOpen, setEditingMember]);


  useEffect(() => {
    if (setMobileHeaderActions) {
      const addMemberButtonDialog = (
        <Dialog open={isMemberFormOpen} onOpenChange={(isOpen) => { setIsMemberFormOpen(isOpen); if (!isOpen) setEditingMember(null); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Users className="mr-2 h-4 w-4" /> Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <FamilyMemberForm
              member={editingMember || undefined}
              onSave={handleSaveMember}
              onClose={() => { setIsMemberFormOpen(false); setEditingMember(null); }}
            />
          </DialogContent>
        </Dialog>
      );
      setMobileHeaderActions(addMemberButtonDialog);
    }
    return () => {
      if (setMobileHeaderActions) {
        setMobileHeaderActions(null);
      }
    };
  }, [setMobileHeaderActions, isMemberFormOpen, setIsMemberFormOpen, editingMember, setEditingMember, handleSaveMember]);


  const handleDeleteMemberTrigger = (memberId: string, memberName: string) => {
    setMemberToDelete({ id: memberId, name: memberName });
    setShowDeleteMemberDialog(true);
  };

  const confirmDeleteMember = useCallback(async () => {
    if (!memberToDelete) return;
    const notesToDelete = diaryNotes.filter(note => note.familyMemberId === memberToDelete.id);
    try {
      await Promise.all(notesToDelete.map(note => deleteDiaryNoteFromDb(note.id)));
      await deleteFamilyMemberFromDb(memberToDelete.id);

      if (selectedMember?.id === memberToDelete.id) {
        setSelectedMember(null);
      }
      toast({ title: "Deleted!", description: `Family member ${memberToDelete.name} and their notes removed.`, variant: "destructive" });
    } catch (e: any) {
      let description = "Failed to delete family member or their notes.";
      if (e && e.message) {
        description += ` Details: ${e.message.substring(0, 100)}${e.message.length > 100 ? '...' : ''}`;
      }
      toast({ title: "Database Error", description: description, variant: "destructive" });
      console.error("Failed to delete family member or their notes. Error object:", e);
      if (e && e.code) {
        console.error("Firebase Error Code:", e.code);
      }
    } finally {
      setMemberToDelete(null);
      setShowDeleteMemberDialog(false);
    }
  }, [deleteFamilyMemberFromDb, deleteDiaryNoteFromDb, diaryNotes, selectedMember, toast, memberToDelete]);

  const handleEditMember = useCallback((memberToEdit: FamilyMember) => {
    setEditingMember(memberToEdit);
    setIsMemberFormOpen(true);
  }, []);

  const handleSaveNote = useCallback(async (noteData: Omit<DiaryNote, 'id' | 'familyMemberId' | 'createdAt'>) => {
    if (!selectedMember) {
      toast({ title: "Error", description: "No family member selected.", variant: "destructive" });
      return;
    }
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to add a note.", variant: "destructive" });
      return;
    }
    const newNoteData: Omit<DiaryNote, 'id'> = {
      ...noteData,
      familyMemberId: selectedMember.id,
      createdAt: new Date().toISOString(),
    };
    try {
      await addDiaryNoteToDb(newNoteData);
      toast({ title: "Success!", description: "New diary note added." });
      setIsNoteFormOpen(false);
    } catch (e: any) {
      let description = "Failed to add note.";
      if (e && e.message) {
        description += ` Details: ${e.message.substring(0, 100)}${e.message.length > 100 ? '...' : ''}`;
      }
      toast({ title: "Database Error", description: description, variant: "destructive" });
      console.error("Failed to add note. Error object:", e);
      if (e && e.code) {
        console.error("Firebase Error Code:", e.code);
      }
    }
  }, [selectedMember, addDiaryNoteToDb, toast, user]);

  const handleDeleteNoteTrigger = (noteId: string) => {
    setNoteToDeleteId(noteId);
    setShowDeleteNoteDialog(true);
  };

  const confirmDeleteNote = useCallback(async () => {
    if (!noteToDeleteId) return;
    try {
      await deleteDiaryNoteFromDb(noteToDeleteId);
      toast({ title: "Deleted!", description: "Diary note removed.", variant: "destructive" });
    } catch (e: any) {
      let description = "Failed to delete note.";
      if (e && e.message) {
        description += ` Details: ${e.message.substring(0, 100)}${e.message.length > 100 ? '...' : ''}`;
      }
      toast({ title: "Database Error", description: description, variant: "destructive" });
      console.error("Failed to delete note. Error object:", e);
      if (e && e.code) {
        console.error("Firebase Error Code:", e.code);
      }
    } finally {
      setNoteToDeleteId(null);
      setShowDeleteNoteDialog(false);
    }
  }, [deleteDiaryNoteFromDb, toast, noteToDeleteId]);

  const filteredFamilyMembers = useMemo(() => {
    if (!familySearchTerm) return familyMembersFromDb;
    const lowercasedFilter = familySearchTerm.toLowerCase();
    return familyMembersFromDb.filter(member =>
      member.realName.toLowerCase().includes(lowercasedFilter) ||
      (member.customName && member.customName.toLowerCase().includes(lowercasedFilter))
    );
  }, [familyMembersFromDb, familySearchTerm]);

  const notesForSelectedMember = useMemo(() => {
    if (!selectedMember) return [];
    let filteredNotes = diaryNotes.filter(note => note.familyMemberId === selectedMember.id);
    
    if (noteSearchTerm) {
      const lowercasedNoteSearch = noteSearchTerm.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.noteText.toLowerCase().includes(lowercasedNoteSearch)
      );
    }

    return filteredNotes.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return noteSortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [selectedMember, diaryNotes, noteSearchTerm, noteSortOrder]);

  const isLoading = familyMembersLoading || diaryNotesLoading;
  const RtdbError = familyMembersError || diaryNotesError;

  if (!isClientLoaded || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Diary Data...</p>
      </div>
    );
  }

  if (RtdbError) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <UIDescription>
            Error loading diary data: {RtdbError.message}. Ensure Firebase is configured and you're logged in.
          </UIDescription>
        </Alert>
      </div>
    );
  }

  if (!user && !isLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">Please Log In</p>
        <p className="text-muted-foreground">You need to be logged in to view and manage the diary.</p>
      </div>
    );
  }


  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <PageHeader
            title="Family Diary"
            description="A digital memory book for your loved ones."
            icon={BookHeart}
            actions={
            <Dialog open={isMemberFormOpen} onOpenChange={(isOpen) => { setIsMemberFormOpen(isOpen); if (!isOpen) setEditingMember(null); }}>
                <DialogTrigger asChild>
                <Button>
                    <Users className="mr-2 h-4 w-4" /> Add Family Member
                </Button>
                </DialogTrigger>
                <DialogContent>
                <FamilyMemberForm
                    member={editingMember || undefined}
                    onSave={handleSaveMember}
                    onClose={() => { setIsMemberFormOpen(false); setEditingMember(null); }}
                />
                </DialogContent>
            </Dialog>
            }
        />
      </div>

      {!selectedMember ? (
        <>
          <Card className="shadow-sm">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search family members..."
                  value={instantFamilySearchTerm}
                  onChange={(e) => setInstantFamilySearchTerm(e.target.value)}
                  className="pl-8 w-full"
                  aria-label="Search family members"
                />
              </div>
            </CardContent>
          </Card>

          {filteredFamilyMembers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {filteredFamilyMembers.map(member => (
                <FamilyMemberDisplayCard
                  key={member.id}
                  member={member}
                  onSelectMember={setSelectedMember}
                  onEditMember={handleEditMember}
                  onDeleteMemberTrigger={handleDeleteMemberTrigger}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 rounded-lg bg-card border shadow-sm">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No family members found.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {familySearchTerm ? "Try a different search term or " : "Start by "}
                adding a family member to your diary.
              </p>
              <Dialog open={isMemberFormOpen} onOpenChange={(isOpen) => { setIsMemberFormOpen(isOpen); if (!isOpen) setEditingMember(null); }}>
                <DialogTrigger asChild>
                  <Button className="mt-4">
                    <Users className="mr-2 h-4 w-4" /> Add Family Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <FamilyMemberForm
                    member={editingMember || undefined}
                    onSave={handleSaveMember}
                    onClose={() => { setIsMemberFormOpen(false); setEditingMember(null); }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="outline" onClick={() => setSelectedMember(null)} size="sm" className="text-xs px-2 py-1 h-auto sm:text-sm sm:px-3 sm:py-2 sm:h-9">
                &larr; Back
              </Button>
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage
                    src={
                      (selectedMember.avatarUrl && selectedMember.avatarUrl !== DEFAULT_PLACEHOLDER_AVATAR && selectedMember.avatarUrl.startsWith('http'))
                      ? selectedMember.avatarUrl
                      : generateDiceBearAvatar(selectedMember.realName)
                    }
                    alt={displayName(selectedMember)} data-ai-hint="cartoon avatar" />
                  <AvatarFallback>{avatarInitial(selectedMember)}</AvatarFallback>
                </Avatar>
                <h2 className="text-base sm:text-xl md:text-2xl font-semibold truncate">{displayName(selectedMember)}'s Notes</h2>
              </div>
            </div>
             <Dialog open={isNoteFormOpen} onOpenChange={setIsNoteFormOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DiaryNoteForm familyMember={selectedMember} onSave={handleSaveNote} onClose={() => setIsNoteFormOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-2 sm:p-3 md:p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search notes..."
                            value={instantNoteSearchTerm}
                            onChange={(e) => setInstantNoteSearchTerm(e.target.value)}
                            className="pl-8 w-full"
                            aria-label="Search notes for selected member"
                        />
                    </div>
                    <Select value={noteSortOrder} onValueChange={(value) => setNoteSortOrder(value as SortOrder)}>
                        <SelectTrigger className="w-full" aria-label="Sort notes by date">
                            <ArrowUpDown className="mr-2 h-4 w-4 inline-block" />
                            <SelectValue placeholder="Sort by date" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
          </Card>

          {notesForSelectedMember.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {notesForSelectedMember.map(note => (
                <DiaryNoteDisplayCard key={note.id} note={note} onDeleteNoteTrigger={handleDeleteNoteTrigger} />
              ))}
            </div>
          ) : (
             <div className="text-center py-10 rounded-lg bg-card border shadow-sm">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">
                {noteSearchTerm ? `No notes found for "${noteSearchTerm}"` : `No notes for ${displayName(selectedMember)} yet.`}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {noteSearchTerm ? "Try a different search term or clear the search." : `Click "Add Note" to write something down for them.`}
              </p>
              {!noteSearchTerm && (
                <Dialog open={isNoteFormOpen} onOpenChange={setIsNoteFormOpen}>
                  <DialogTrigger asChild>
                    <Button className="mt-4">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add Note
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DiaryNoteForm familyMember={selectedMember} onSave={handleSaveNote} onClose={() => setIsNoteFormOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          )}
        </div>
      )}
      <AlertDialog open={showDeleteMemberDialog} onOpenChange={setShowDeleteMemberDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {memberToDelete?.name || 'this member'} and all their associated diary notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMemberToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMember} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete Member</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={showDeleteNoteDialog} onOpenChange={setShowDeleteNoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this diary note. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNote} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">Delete Note</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

