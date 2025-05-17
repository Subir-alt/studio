
'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { ClipboardList, PlusCircle, ArrowUpDown, Loader2, AlertTriangle, Trash2, Edit2, User } from 'lucide-react';
import { format } from 'date-fns';

import useRtdbList from '@/hooks/use-rtdb-list';
import type { CommonNote, SortOrder } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription as UIDescription } from '@/components/ui/alert';
import { useSetMobileHeaderActions } from '@/components/layout/app-layout';
import { useAuth } from '@/context/AuthContext';

interface CommonNoteFormProps {
  note?: CommonNote;
  onSave: (noteData: Pick<CommonNote, 'text'>, id?: string) => void;
  onClose: () => void;
  isEditing: boolean;
}

function CommonNoteForm({ note, onSave, onClose, isEditing }: CommonNoteFormProps) {
  const [text, setText] = useState(note?.text || '');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({ title: "Error", description: "Note text cannot be empty.", variant: "destructive" });
      return;
    }
    onSave({ text: text.trim() }, note?.id);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? 'Edit' : 'Add'} Common Note</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Textarea
          id="common-note-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your common note..."
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

interface CommonNoteItemCardProps {
  note: CommonNote;
  onEdit: (note: CommonNote) => void;
  onDeleteTrigger: (noteId: string) => void;
  currentUserId: string | undefined;
}

const CommonNoteItemCard = memo(({ note, onEdit, onDeleteTrigger, currentUserId }: CommonNoteItemCardProps) => {
  const canModify = note.createdByUid === currentUserId;

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <CardHeader className="p-2 sm:p-3 md:p-4">
        <CardTitle className="text-sm sm:text-base break-words whitespace-pre-wrap">{note.text}</CardTitle>
        <CardDescription className="text-xs sm:text-sm flex items-center gap-1 pt-1">
          <User className="h-3 w-3" /> <span>{note.creatorDisplayName}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow px-2 sm:px-3 md:px-4 pb-1 sm:pb-2">
        <p className="text-xs text-muted-foreground">
          Created: {format(new Date(note.createdAt), 'MMM d, yyyy HH:mm')}
          {note.updatedAt && note.updatedAt !== note.createdAt && (
            <span className="italic"> (edited: {format(new Date(note.updatedAt), 'MMM d, yyyy HH:mm')})</span>
          )}
        </p>
      </CardContent>
      {canModify && (
        <CardFooter className="flex justify-end items-center p-2 sm:p-3 md:p-4 pt-1 sm:pt-2 border-t gap-2">
          <Button variant="ghost" size="sm" onClick={() => onEdit(note)} className="text-xs sm:text-sm">
            <Edit2 className="h-3 w-3 mr-1 sm:mr-2" /> Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDeleteTrigger(note.id)} className="text-destructive hover:text-destructive text-xs sm:text-sm">
            <Trash2 className="h-3 w-3 mr-1 sm:mr-2" /> Delete
          </Button>
        </CardFooter>
      )}
    </Card>
  );
});
CommonNoteItemCard.displayName = 'CommonNoteItemCard';

export default function CommonNotesPage() {
  const { user } = useAuth();
  const {
    items: commonNotes,
    addItem: addCommonNoteToDb,
    updateItem: updateCommonNoteInDb,
    deleteItem: deleteCommonNoteFromDb,
    loading: notesLoading,
    error: notesError
  } = useRtdbList<CommonNote>('commonNotes', { pathType: 'globalRoot' });

  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<CommonNote | null>(null);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  const { toast } = useToast();
  const setMobileHeaderActions = useSetMobileHeaderActions();

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  const handleSaveNote = useCallback(async (noteData: Pick<CommonNote, 'text'>, id?: string) => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      if (id) { // Editing existing note
        const noteToUpdate = commonNotes.find(n => n.id === id);
        if (noteToUpdate && noteToUpdate.createdByUid !== user.uid) {
          toast({ title: "Permission Denied", description: "You can only edit your own notes.", variant: "destructive" });
          return;
        }
        await updateCommonNoteInDb(id, { ...noteData, updatedAt: new Date().toISOString() });
        toast({ title: "Success!", description: "Common note updated." });
      } else { // Adding new note
        // createdByUid and creatorDisplayName are handled by useRtdbList for globalRoot paths
        await addCommonNoteToDb({
          text: noteData.text,
          // createdAt is handled by useRtdbList or set here
        });
        toast({ title: "Success!", description: "New common note added." });
      }
      setIsFormOpen(false);
      setEditingNote(null);
    } catch (e: any) {
      toast({ title: "Database Error", description: e.message || "Failed to save common note.", variant: "destructive" });
      console.error("Failed to save common note:", e);
    }
  }, [user, addCommonNoteToDb, updateCommonNoteInDb, toast, commonNotes]);

  const handleEditNote = useCallback((note: CommonNote) => {
    if (note.createdByUid !== user?.uid) {
      toast({ title: "Permission Denied", description: "You can only edit your own notes.", variant: "destructive" });
      return;
    }
    setEditingNote(note);
    setIsFormOpen(true);
  }, [user]);

  const handleDeleteNoteTrigger = (noteId: string) => {
    const noteToDelete = commonNotes.find(n => n.id === noteId);
    if (noteToDelete && noteToDelete.createdByUid !== user?.uid) {
       toast({ title: "Permission Denied", description: "You can only delete your own notes.", variant: "destructive" });
      return;
    }
    setNoteToDeleteId(noteId);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteNote = useCallback(async () => {
    if (!noteToDeleteId) return;
     const noteToDelete = commonNotes.find(n => n.id === noteToDeleteId);
    if (noteToDelete && noteToDelete.createdByUid !== user?.uid) {
       toast({ title: "Permission Denied", description: "You can only delete your own notes.", variant: "destructive" });
       setNoteToDeleteId(null);
       setShowDeleteConfirmDialog(false);
      return;
    }
    try {
      await deleteCommonNoteFromDb(noteToDeleteId);
      toast({ title: "Deleted!", description: "Common note removed.", variant: "destructive" });
    } catch (e: any) {
      toast({ title: "Database Error", description: e.message || "Failed to delete common note.", variant: "destructive" });
      console.error("Failed to delete common note:", e);
    } finally {
      setNoteToDeleteId(null);
      setShowDeleteConfirmDialog(false);
    }
  }, [deleteCommonNoteFromDb, toast, user, commonNotes, noteToDeleteId]);

  useEffect(() => {
    if (setMobileHeaderActions) {
      const addNoteButtonDialog = (
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingNote(null); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CommonNoteForm
              note={editingNote || undefined}
              onSave={handleSaveNote}
              onClose={() => { setIsFormOpen(false); setEditingNote(null); }}
              isEditing={!!editingNote}
            />
          </DialogContent>
        </Dialog>
      );
      setMobileHeaderActions(addNoteButtonDialog);
    }
    return () => {
      if (setMobileHeaderActions) setMobileHeaderActions(null);
    };
  }, [setMobileHeaderActions, isFormOpen, setIsFormOpen, editingNote, handleSaveNote]);

  const sortedCommonNotes = useMemo(() => {
    return [...commonNotes].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [commonNotes, sortOrder]);

  if (!isClientLoaded || notesLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Common Notes...</p>
      </div>
    );
  }

  if (notesError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <UIDescription>
            Error loading common notes: {notesError.message}.
          </UIDescription>
        </Alert>
      </div>
    );
  }

  if (!user && !notesLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">Please Log In</p>
        <p className="text-muted-foreground">You need to be logged in to view and manage common notes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <PageHeader
          title="Common Notes"
          description="Shared notes for everyone."
          icon={ClipboardList}
          actions={
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingNote(null); }}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Common Note
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CommonNoteForm
                  note={editingNote || undefined}
                  onSave={handleSaveNote}
                  onClose={() => { setIsFormOpen(false); setEditingNote(null); }}
                  isEditing={!!editingNote}
                />
              </DialogContent>
            </Dialog>
          }
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="flex justify-end">
            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
              <SelectTrigger className="w-full sm:w-[180px]" aria-label="Sort notes by date">
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

      {sortedCommonNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {sortedCommonNotes.map(note => (
            <CommonNoteItemCard
              key={note.id}
              note={note}
              onEdit={handleEditNote}
              onDeleteTrigger={handleDeleteNoteTrigger}
              currentUserId={user?.uid}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 rounded-lg bg-card border shadow-sm">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No common notes yet.</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Click "Add Common Note" to share something.
          </p>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingNote(null); }}>
            <DialogTrigger asChild>
              <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Common Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CommonNoteForm
                note={editingNote || undefined}
                onSave={handleSaveNote}
                onClose={() => { setIsFormOpen(false); setEditingNote(null); }}
                isEditing={!!editingNote}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}

      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this common note. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNote} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete Note
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
