
'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Lightbulb, PlusCircle, Search, Filter as FilterIcon, ArrowUpDown, Loader2, AlertTriangle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

import useRtdbList from '@/hooks/use-rtdb-list';
import type { Idea, IdeaStatus, SortOrder } from '@/lib/types';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription as UIDescription } from '@/components/ui/alert'; // Renamed to avoid conflict
import { useDebounce } from '@/hooks/use-debounce';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { useSetMobileHeaderActions } from '@/components/layout/app-layout';
import { useAuth } from '@/context/AuthContext';


interface IdeaItemProps {
  idea: Idea;
  onToggleStatus: (id: string, currentStatus: 'pending' | 'done') => void;
  onDeleteIdeaTrigger: (id: string) => void; // Changed to trigger dialog
}

const IdeaItem = memo(({ idea, onToggleStatus, onDeleteIdeaTrigger }: IdeaItemProps) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <CardHeader className="p-2 sm:p-3 md:p-4">
        <CardTitle className="text-sm sm:text-base break-words">{idea.text}</CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          Category: <span className="font-medium text-primary">{idea.category || 'Uncategorized'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow px-2 sm:px-3 md:px-4 pb-1 sm:pb-2">
        <p className="text-xs text-muted-foreground">
          Created: {format(new Date(idea.createdAt), 'MMM d, yyyy HH:mm')}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center p-2 sm:p-3 md:p-4 pt-1 sm:pt-2 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`status-${idea.id}`}
            checked={idea.status === 'done'}
            onCheckedChange={() => onToggleStatus(idea.id, idea.status)}
            aria-label={`Mark idea as ${idea.status === 'done' ? 'pending' : 'done'}`}
          />
          <Label htmlFor={`status-${idea.id}`} className="text-xs sm:text-sm font-medium cursor-pointer">
            {idea.status === 'done' ? 'Done' : 'Pending'}
          </Label>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDeleteIdeaTrigger(idea.id)} className="text-destructive hover:text-destructive text-xs sm:text-sm">
           <Trash2 className="h-3 w-3 mr-1 sm:mr-2" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
});
IdeaItem.displayName = 'IdeaItem';


export default function IdeasPage() {
  const { user } = useAuth(); // Get user for data scoping
  const { 
    items: ideas, 
    addItem: addIdeaToDb, 
    updateItem: updateIdeaInDb, 
    deleteItem: deleteIdeaFromDb, 
    loading: ideasLoading, 
    error: ideasError 
  } = useRtdbList<Idea>(user ? 'ideas' : ''); // Pass 'ideas' as base path, hook handles user scoping
  
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [instantSearchTerm, setInstantSearchTerm] = useState('');
  const searchTerm = useDebounce(instantSearchTerm, 300); 
  const [statusFilter, setStatusFilter] = useState<IdeaStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');
  const [newIdeaCategory, setNewIdeaCategory] = useState('');

  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [ideaToDeleteId, setIdeaToDeleteId] = useState<string | null>(null);

  const { toast } = useToast();
  const setMobileHeaderActions = useSetMobileHeaderActions();

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  const handleAddIdea = useCallback(async () => {
    if (!user) {
      toast({ title: "Authentication Error", description: "You must be logged in to add an idea.", variant: "destructive" });
      return;
    }
    if (!newIdeaText.trim()) {
      toast({ title: "Oops!", description: "Idea text cannot be empty.", variant: "destructive" });
      return;
    }
    const newIdeaData: Omit<Idea, 'id'> = {
      text: newIdeaText.trim(),
      category: newIdeaCategory.trim() || 'Uncategorized',
      createdAt: new Date().toISOString(),
      status: 'pending',
      // ownerUid: user.uid, // ownerUid is now implicit in the path via useRtdbList
    };
    try {
      await addIdeaToDb(newIdeaData);
      setNewIdeaText('');
      setNewIdeaCategory('');
      setIsFormOpen(false);
      toast({ title: "Success!", description: "New idea added." });
    } catch (e: any) {
      let description = "Failed to add idea.";
      if (e && e.message) {
        description += ` Details: ${e.message.substring(0, 200)}${e.message.length > 200 ? '...' : ''}`;
      }
      toast({ title: "Database Error", description, variant: "destructive" });
      console.error("Failed to add idea. Error object:", e);
      if (e && e.code) {
        console.error("Firebase Error Code:", e.code);
      }
       if (e && e.stack) {
        console.error("Firebase Error Stack:", e.stack);
      }
    }
  }, [newIdeaText, newIdeaCategory, addIdeaToDb, toast, user]);

  useEffect(() => {
    if (setMobileHeaderActions) {
      const addIdeaButtonDialog = (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button size="sm"> {/* Smaller button for header */}
              <PlusCircle className="mr-2 h-4 w-4" /> Add Idea
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Idea</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="idea-text-dialog" className="text-right">
                  Idea
                </Label>
                <Textarea
                  id="idea-text-dialog"
                  value={newIdeaText}
                  onChange={(e) => setNewIdeaText(e.target.value)}
                  className="col-span-3"
                  placeholder="What's your new idea?"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="idea-category-dialog" className="text-right">
                  Category
                </Label>
                <Input
                  id="idea-category-dialog"
                  value={newIdeaCategory}
                  onChange={(e) => setNewIdeaCategory(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Work, Personal (Optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleAddIdea}>Save Idea</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );
      setMobileHeaderActions(addIdeaButtonDialog);
    }
    return () => {
      if (setMobileHeaderActions) {
        setMobileHeaderActions(null);
      }
    };
  }, [
    setMobileHeaderActions, 
    isFormOpen, 
    setIsFormOpen, 
    newIdeaText, 
    newIdeaCategory, 
    handleAddIdea
  ]);


  const categories = useMemo(() => {
    const uniqueCategories = Array.from(new Set(ideas.map(idea => idea.category).filter(Boolean)));
    return ['all', ...uniqueCategories.sort((a, b) => (a as string).localeCompare(b as string))];
  }, [ideas]);

  const filteredAndSortedIdeas = useMemo(() => {
    let result = ideas;

    if (searchTerm) { 
      result = result.filter(idea =>
        idea.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (idea.category && idea.category.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(idea => idea.status === statusFilter);
    }

    if (categoryFilter !== 'all') {
      result = result.filter(idea => idea.category === categoryFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [ideas, searchTerm, statusFilter, categoryFilter, sortOrder]); 

  

  const handleToggleStatus = useCallback(async (id: string, currentStatus: 'pending' | 'done') => {
    try {
      await updateIdeaInDb(id, { status: currentStatus === 'pending' ? 'done' : 'pending' });
      toast({ title: "Updated!", description: "Idea status changed." });
    } catch (e: any) {
      let description = "Failed to update idea status.";
      if (e && e.message) {
        description += ` Details: ${e.message.substring(0, 100)}${e.message.length > 100 ? '...' : ''}`;
      }
      toast({ title: "Database Error", description, variant: "destructive" });
      console.error("Failed to update idea status. Error object:", e);
      if (e && e.code) {
        console.error("Firebase Error Code:", e.code);
      }
    }
  }, [updateIdeaInDb, toast]);
  
  const handleDeleteIdeaTrigger = (id: string) => {
    setIdeaToDeleteId(id);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteIdea = useCallback(async () => {
    if (!ideaToDeleteId) return;
    try {
      await deleteIdeaFromDb(ideaToDeleteId);
      toast({ title: "Deleted!", description: "Idea removed.", variant: "destructive" });
      setIdeaToDeleteId(null);
      setShowDeleteConfirmDialog(false);
    } catch (e: any)
     {
      let description = "Failed to delete idea.";
      if (e && e.message) {
        description += ` Details: ${e.message.substring(0, 100)}${e.message.length > 100 ? '...' : ''}`;
      }
      toast({ title: "Database Error", description, variant: "destructive" });
      console.error("Failed to delete idea. Error object:", e);
      if (e && e.code) {
        console.error("Firebase Error Code:", e.code);
      }
      setIdeaToDeleteId(null);
      setShowDeleteConfirmDialog(false);
    }
  }, [deleteIdeaFromDb, toast, ideaToDeleteId]);

  if (!isClientLoaded || ideasLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Ideas...</p>
      </div>
    );
  }

  if (ideasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <UIDescription>
            Error loading ideas: {ideasError.message}. Please ensure your Firebase configuration is correct and the database is accessible.
          </UIDescription>
        </Alert>
      </div>
    );
  }
  
  if (!user && !ideasLoading) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-lg font-medium">Please Log In</p>
        <p className="text-muted-foreground">You need to be logged in to view and manage ideas.</p>
      </div>
    );
  }


  const desktopFilterControls = () => (
    <>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search ideas..."
          value={instantSearchTerm} 
          onChange={(e) => setInstantSearchTerm(e.target.value)} 
          className="pl-8 w-full"
          aria-label="Search ideas"
        />
      </div>
      <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IdeaStatus)}>
        <SelectTrigger className="w-full" aria-label="Filter by status">
          <FilterIcon className="mr-2 h-4 w-4 inline-block" />
          <SelectValue placeholder="Filter by status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="done">Done</SelectItem>
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
        <SelectTrigger className="w-full" aria-label="Filter by category">
          <FilterIcon className="mr-2 h-4 w-4 inline-block" />
          <SelectValue placeholder="Filter by category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map(cat => (
            <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
        <SelectTrigger className="w-full" aria-label="Sort by date">
          <ArrowUpDown className="mr-2 h-4 w-4 inline-block" />
          <SelectValue placeholder="Sort by date" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="oldest">Oldest First</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  const mobileSheetFilterControls = () => (
    <>
      <div>
        <Label htmlFor="status-filter-sheet" className="text-sm font-medium mb-1 block">Status</Label>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IdeaStatus)}>
          <SelectTrigger id="status-filter-sheet" className="w-full" aria-label="Filter by status">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="done">Done</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="category-filter-sheet" className="text-sm font-medium mb-1 block">Category</Label>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger id="category-filter-sheet" className="w-full" aria-label="Filter by category">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat === 'all' ? 'All Categories' : cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="sort-order-sheet" className="text-sm font-medium mb-1 block">Sort Order</Label>
        <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
          <SelectTrigger id="sort-order-sheet" className="w-full" aria-label="Sort by date">
            <ArrowUpDown className="mr-2 h-4 w-4 inline-block" />
            <SelectValue placeholder="Sort by date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );


  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <PageHeader
            title="Idea Tracker"
            description="Capture and organize your brilliant ideas."
            icon={Lightbulb}
            actions={
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Idea
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Idea</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="idea-text-desktop" className="text-right">
                        Idea
                    </Label>
                    <Textarea
                        id="idea-text-desktop"
                        value={newIdeaText}
                        onChange={(e) => setNewIdeaText(e.target.value)}
                        className="col-span-3"
                        placeholder="What's your new idea?"
                        rows={3}
                    />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="idea-category-desktop" className="text-right">
                        Category
                    </Label>
                    <Input
                        id="idea-category-desktop"
                        value={newIdeaCategory}
                        onChange={(e) => setNewIdeaCategory(e.target.value)}
                        className="col-span-3"
                        placeholder="e.g., Work, Personal (Optional)"
                    />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleAddIdea}>Save Idea</Button>
                </DialogFooter>
                </DialogContent>
            </Dialog>
            }
        />
      </div>


      <Card className="shadow-sm">
        <CardContent className="p-2 sm:p-3 md:p-4">
          <div className="md:hidden space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search ideas..."
                value={instantSearchTerm} 
                onChange={(e) => setInstantSearchTerm(e.target.value)} 
                className="pl-8 w-full"
                aria-label="Search ideas"
              />
            </div>
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="w-full justify-center">
                  <FilterIcon className="mr-2 h-4 w-4" />
                  Filter & Sort
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-lg max-h-[70vh] flex flex-col">
                <SheetHeader className="mb-2 flex-shrink-0">
                  <SheetTitle>Filter & Sort Ideas</SheetTitle>
                </SheetHeader>
                <div className="grid gap-4 overflow-y-auto py-2 flex-grow">
                  {mobileSheetFilterControls()}
                </div>
                <SheetFooter className="mt-4 flex-shrink-0">
                  <SheetClose asChild>
                    <Button className="w-full">Done</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>

          <div className="hidden md:grid md:grid-cols-4 gap-4">
            {desktopFilterControls()}
          </div>
        </CardContent>
      </Card>
      
      {filteredAndSortedIdeas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {filteredAndSortedIdeas.map(idea => (
            <IdeaItem key={idea.id} idea={idea} onToggleStatus={handleToggleStatus} onDeleteIdeaTrigger={handleDeleteIdeaTrigger} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 rounded-lg bg-card border shadow-sm">
          <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No ideas yet!</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Click "Add Idea" to get started.
          </p>
           <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Idea
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Idea</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-idea-text-empty" className="text-right">
                    Idea
                  </Label>
                  <Textarea
                    id="new-idea-text-empty"
                    value={newIdeaText}
                    onChange={(e) => setNewIdeaText(e.target.value)}
                    className="col-span-3"
                    placeholder="What's your new idea?"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="new-idea-category-empty" className="text-right">
                    Category
                  </Label>
                  <Input
                    id="new-idea-category-empty"
                    value={newIdeaCategory}
                    onChange={(e) => setNewIdeaCategory(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., Work, Personal (Optional)"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <Button onClick={handleAddIdea}>Save Idea</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      <AlertDialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this idea.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIdeaToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteIdea}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
