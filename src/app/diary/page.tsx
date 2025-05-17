
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
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDebounce } from '@/hooks/use-debounce';

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
  const [avatarUrl, setAvatarUrl] = useState(member?.avatarUrl || `https://placehold.co/100x100.png`);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!realName.trim()) {
      toast({ title: "Error", description: "Real name is required.", variant: "destructive" });
      return;
    }
    
    const memberPayload: Partial<Omit<FamilyMember, 'id'>> = {
      realName: realName.trim(),
      avatarUrl: avatarUrl.trim() || `https://placehold.co/100x100.png`,
    };

    const trimmedCustomName = customName.trim();

    if (member && !trimmedCustomName) { // Editing existing member and customName is cleared
      memberPayload.customName = null; // Explicitly set to null to remove from DB
    } else if (trimmedCustomName) { // Adding new member or editing existing one with a value
      memberPayload.customName = trimmedCustomName;
    }
    // If adding a new member and customName is empty, the customName property is simply not added to memberPayload.

    onSave(memberPayload, member?.id);
  };

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
          <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} className="col-span-3" placeholder="https://placehold.co/100x100.png" />
        </div>
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
  onDeleteMember: (memberId: string) => void;
}

const FamilyMemberDisplayCard = memo(({ member, onSelectMember, onEditMember, onDeleteMember }: FamilyMemberDisplayCardProps) => {
  const handleCardClick = useCallback(() => onSelectMember(member), [member, onSelectMember]);
  const handleEditClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEditMember(member);
  }, [member, onEditMember]);
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteMember(member.id);
  },[member.id, onDeleteMember]);

  return (
    <Card 
      className="cursor-pointer hover:shadow-xl transition-shadow duration-200 flex flex-col"
      onClick={handleCardClick}
      data-ai-hint="family member"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
    >
      <CardHeader className="items-center text-center">
        <Avatar className="h-20 w-20 mb-2">
          <AvatarImage src={member.avatarUrl} alt={displayName(member)} data-ai-hint="person portrait" />
          <AvatarFallback>{avatarInitial(member)}</AvatarFallback>
        </Avatar>
        <CardTitle>{displayName(member)}</CardTitle>
        {member.customName && <CardDescription>{member.realName}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-grow"></CardContent>
      <CardFooter className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" size="icon" onClick={handleEditClick} aria-label={`Edit ${displayName(member)}`}>
            <Edit2 className="h-4 w-4" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={handleDeleteClick} aria-label={`Delete ${displayName(member)}`}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
      </CardFooter>
    </Card>
  );
});
FamilyMemberDisplayCard.displayName = 'FamilyMemberDisplayCard';

interface DiaryNoteDisplayCardProps {
  note: DiaryNote;
  onDeleteNote: (noteId: string) => void;
}

const DiaryNoteDisplayCard = memo(({ note, onDeleteNote }: DiaryNoteDisplayCardProps) => {
  return (
    <Card className="shadow-md">
      <CardContent className="p-4">
        <p className="whitespace-pre-wrap break-words">{note.noteText}</p>
        <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
            {format(new Date(note.createdAt), 'MMM d, yyyy HH:mm')}
            </p>
            <Button variant="ghost" size="sm" onClick={() => onDeleteNote(note.id)} className="text-destructive hover:text-destructive">
                Delete
            </Button>
        </div>
      </CardContent>
    </Card>
  );
});
DiaryNoteDisplayCard.displayName = 'DiaryNoteDisplayCard';


export default function DiaryPage() {
  const { 
    items: familyMembers, 
    addItem: addFamilyMemberToDb, 
    updateItem: updateFamilyMemberInDb, 
    deleteItem: deleteFamilyMemberFromDb, 
    loading: familyMembersLoading, 
    error: familyMembersError 
  } = useRtdbList<FamilyMember>('familyMembers');

  const { 
    items: diaryNotes, 
    addItem: addDiaryNoteToDb, 
    deleteItem: deleteDiaryNoteFromDb, 
    loading: diaryNotesLoading, 
    error: diaryNotesError 
  } = useRtdbList<DiaryNote>('diaryNotes');
  
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [isMemberFormOpen, setIsMemberFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false);
  const [instantSearchTerm, setInstantSearchTerm] = useState('');
  const searchTerm = useDebounce(instantSearchTerm, 300); // Debounced search term for notes
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const { toast } = useToast();

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  const handleSaveMember = useCallback(async (memberData: Partial<Omit<FamilyMember, 'id'>>, id?: string) => {
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
  }, [addFamilyMemberToDb, updateFamilyMemberInDb, toast, editingMember]);

  const handleDeleteMember = useCallback(async (memberId: string) => {
    const notesToDelete = diaryNotes.filter(note => note.familyMemberId === memberId);
    try {
      await Promise.all(notesToDelete.map(note => deleteDiaryNoteFromDb(note.id)));
      await deleteFamilyMemberFromDb(memberId);
      
      if (selectedMember?.id === memberId) {
        setSelectedMember(null);
      }
      toast({ title: "Deleted!", description: "Family member and their notes removed.", variant: "destructive" });
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
    }
  }, [deleteFamilyMemberFromDb, deleteDiaryNoteFromDb, diaryNotes, selectedMember, toast]);
  
  const handleEditMember = useCallback((memberToEdit: FamilyMember) => {
    setEditingMember(memberToEdit);
    setIsMemberFormOpen(true);
  }, []); // setEditingMember and setIsMemberFormOpen are stable

  const handleSaveNote = useCallback(async (noteData: Omit<DiaryNote, 'id' | 'familyMemberId' | 'createdAt'>) => {
    if (!selectedMember) {
      toast({ title: "Error", description: "No family member selected.", variant: "destructive" });
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
  }, [selectedMember, addDiaryNoteToDb, toast]);

  const handleDeleteNote = useCallback(async (noteId: string) => {
    try {
      await deleteDiaryNoteFromDb(noteId);
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
    }
  }, [deleteDiaryNoteFromDb, toast]);

  const notesForSelectedMember = useMemo(() => {
    if (!selectedMember) return [];
    return diaryNotes
      .filter(note => note.familyMemberId === selectedMember.id)
      .filter(note => note.noteText.toLowerCase().includes(searchTerm.toLowerCase())) // Use debounced searchTerm
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
      });
  }, [selectedMember, diaryNotes, searchTerm, sortOrder]); // Dependency on debounced searchTerm

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
          <AlertDescription>
            Error loading diary data: {RtdbError.message}. Please ensure your Firebase configuration in /src/lib/firebase.ts is correct and the database is accessible.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {!selectedMember ? (
        <>
          {familyMembers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {familyMembers.map(member => (
                <FamilyMemberDisplayCard 
                  key={member.id} 
                  member={member}
                  onSelectMember={setSelectedMember}
                  onEditMember={handleEditMember}
                  onDeleteMember={handleDeleteMember}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 rounded-lg bg-card border shadow-sm">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No family members added yet.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Start by adding a family member to your diary.
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
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setSelectedMember(null)}>
                &larr; Back to All Members
              </Button>
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedMember.avatarUrl} alt={displayName(selectedMember)} data-ai-hint="person portrait" />
                  <AvatarFallback>{avatarInitial(selectedMember)}</AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-semibold">{displayName(selectedMember)}'s Notes</h2>
              </div>
            </div>
             <Dialog open={isNoteFormOpen} onOpenChange={setIsNoteFormOpen}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DiaryNoteForm familyMember={selectedMember} onSave={handleSaveNote} onClose={() => setIsNoteFormOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          
          <Card className="shadow-sm">
            <CardContent className="p-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search notes..."
                            value={instantSearchTerm} // Use instantSearchTerm for input value
                            onChange={(e) => setInstantSearchTerm(e.target.value)} // Update instantSearchTerm
                            className="pl-8 w-full"
                            aria-label="Search notes for selected member"
                        />
                    </div>
                    <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
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
            <div className="space-y-4">
              {notesForSelectedMember.map(note => (
                <DiaryNoteDisplayCard key={note.id} note={note} onDeleteNote={handleDeleteNote} />
              ))}
            </div>
          ) : (
             <div className="text-center py-10 rounded-lg bg-card border shadow-sm">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No notes for {displayName(selectedMember)} yet.</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Click "Add Note" to write something down for them.
              </p>
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
