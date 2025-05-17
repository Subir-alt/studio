
'use client';

import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { Lightbulb, PlusCircle, Search, Filter, ArrowUpDown, Loader2, AlertTriangle } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IdeaItemProps {
  idea: Idea;
  onToggleStatus: (id: string, currentStatus: 'pending' | 'done') => void;
  onDeleteIdea: (id: string) => void;
}

const IdeaItem = memo(({ idea, onToggleStatus, onDeleteIdea }: IdeaItemProps) => {
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg break-words">{idea.text}</CardTitle>
        <CardDescription>
          Category: <span className="font-medium text-primary">{idea.category || 'Uncategorized'}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-xs text-muted-foreground">
          Created: {format(new Date(idea.createdAt), 'MMM d, yyyy HH:mm')}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`status-${idea.id}`}
            checked={idea.status === 'done'}
            onCheckedChange={() => onToggleStatus(idea.id, idea.status)}
            aria-label={`Mark idea as ${idea.status === 'done' ? 'pending' : 'done'}`}
          />
          <Label htmlFor={`status-${idea.id}`} className="text-sm font-medium cursor-pointer">
            {idea.status === 'done' ? 'Done' : 'Pending'}
          </Label>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onDeleteIdea(idea.id)} className="text-destructive hover:text-destructive">
          Delete
        </Button>
      </CardFooter>
    </Card>
  );
});
IdeaItem.displayName = 'IdeaItem';


export default function IdeasPage() {
  const { 
    items: ideas, 
    addItem: addIdeaToDb, 
    updateItem: updateIdeaInDb, 
    deleteItem: deleteIdeaFromDb, 
    loading: ideasLoading, 
    error: ideasError 
  } = useRtdbList<Idea>('ideas');
  
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<IdeaStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newIdeaText, setNewIdeaText] = useState('');
  const [newIdeaCategory, setNewIdeaCategory] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

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

  const handleAddIdea = useCallback(async () => {
    if (!newIdeaText.trim()) {
      toast({ title: "Oops!", description: "Idea text cannot be empty.", variant: "destructive" });
      return;
    }
    const newIdeaData: Omit<Idea, 'id'> = {
      text: newIdeaText.trim(),
      category: newIdeaCategory.trim() || 'Uncategorized',
      createdAt: new Date().toISOString(),
      status: 'pending',
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
        description += ` Details: ${e.message.substring(0, 100)}${e.message.length > 100 ? '...' : ''}`;
      }
      toast({ title: "Database Error", description, variant: "destructive" });
      console.error("Failed to add idea. Error object:", e);
      if (e && e.code) {
        console.error("Firebase Error Code:", e.code);
      }
    }
  }, [newIdeaText, newIdeaCategory, addIdeaToDb, toast]);

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
  
  const handleDeleteIdea = useCallback(async (id: string) => {
    try {
      await deleteIdeaFromDb(id);
      toast({ title: "Deleted!", description: "Idea removed.", variant: "destructive" });
    } catch (e: any) {
      let description = "Failed to delete idea.";
      if (e && e.message) {
        description += ` Details: ${e.message.substring(0, 100)}${e.message.length > 100 ? '...' : ''}`;
      }
      toast({ title: "Database Error", description, variant: "destructive" });
      console.error("Failed to delete idea. Error object:", e);
      if (e && e.code) {
        console.error("Firebase Error Code:", e.code);
      }
    }
  }, [deleteIdeaFromDb, toast]);

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
          <AlertDescription>
            Error loading ideas: {ideasError.message}. Please ensure your Firebase configuration in /src/lib/firebase.ts is correct and the database is accessible.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
                  <Label htmlFor="idea-text" className="text-right">
                    Idea
                  </Label>
                  <Textarea
                    id="idea-text"
                    value={newIdeaText}
                    onChange={(e) => setNewIdeaText(e.target.value)}
                    className="col-span-3"
                    placeholder="What's your new idea?"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="idea-category" className="text-right">
                    Category
                  </Label>
                  <Input
                    id="idea-category"
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

      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search ideas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
                aria-label="Search ideas"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as IdeaStatus)}>
              <SelectTrigger className="w-full" aria-label="Filter by status">
                 <Filter className="mr-2 h-4 w-4 inline-block" />
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
                <Filter className="mr-2 h-4 w-4 inline-block" />
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
          </div>
        </CardContent>
      </Card>
      
      {filteredAndSortedIdeas.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedIdeas.map(idea => (
            <IdeaItem key={idea.id} idea={idea} onToggleStatus={handleToggleStatus} onDeleteIdea={handleDeleteIdea} />
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
    </div>
  );
}

    