
'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { CalendarClock, PlusCircle, Search, Filter, ArrowUpDown, Edit2, Trash2, CheckCircle2, XCircle, Loader2, AlertTriangle, CalendarIcon } from 'lucide-react';
import { format, parseISO, startOfDay } from 'date-fns';

import useRtdbList from '@/hooks/use-rtdb-list';
import type { Reminder, SortOrder } from '@/lib/types';
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
import { useDebounce } from '@/hooks/use-debounce';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface ReminderFormProps {
  reminder?: Reminder;
  onSave: (reminderData: Partial<Omit<Reminder, 'id' | 'createdAt' | 'isComplete'>>, id?: string) => void;
  onClose: () => void;
}

function ReminderForm({ reminder, onSave, onClose }: ReminderFormProps) {
  const [text, setText] = useState(reminder?.text || '');
  const [dueDate, setDueDate] = useState<Date | undefined>(
    reminder?.dueDate ? parseISO(reminder.dueDate) : undefined
  );
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!text.trim()) {
      toast({ title: "Error", description: "Reminder text is required.", variant: "destructive" });
      return;
    }
    if (!dueDate) {
      toast({ title: "Error", description: "Due date is required.", variant: "destructive" });
      return;
    }

    onSave({
      text: text.trim(),
      dueDate: startOfDay(dueDate).toISOString(), // Store date as ISO string, start of day
    }, reminder?.id);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{reminder ? 'Edit' : 'Add'} Reminder</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="reminder-text" className="text-right">Text</Label>
          <Textarea
            id="reminder-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="col-span-3"
            placeholder="What do you want to be reminded of?"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="reminder-dueDate" className="text-right">Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "col-span-3 justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit}>Save Reminder</Button>
      </DialogFooter>
    </>
  );
}

interface ReminderItemProps {
  reminder: Reminder;
  onToggleComplete: (id: string, currentStatus: boolean) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

const ReminderItem = React.memo(({ reminder, onToggleComplete, onEdit, onDelete }: ReminderItemProps) => {
  const isOverdue = !reminder.isComplete && new Date(reminder.dueDate) < startOfDay(new Date());
  const isDueToday = !reminder.isComplete && new Date(reminder.dueDate).toDateString() === new Date().toDateString();

  return (
    <Card 
        className={cn(
            "shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col",
            reminder.isComplete && "bg-muted/50 opacity-70",
            isOverdue && "border-destructive",
            isDueToday && !isOverdue && "border-yellow-500 dark:border-yellow-400"
        )}
        data-ai-hint="reminder item"
    >
      <CardHeader>
        <CardTitle className={cn("text-lg break-words", reminder.isComplete && "line-through")}>{reminder.text}</CardTitle>
        <CardDescription>
          Due: {format(parseISO(reminder.dueDate), 'EEE, MMM d, yyyy')}
          {isOverdue && <span className="ml-2 text-destructive font-semibold">(Overdue)</span>}
          {isDueToday && !isOverdue && <span className="ml-2 text-yellow-600 dark:text-yellow-500 font-semibold">(Due Today)</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-xs text-muted-foreground">
          Created: {format(parseISO(reminder.createdAt), 'MMM d, yyyy HH:mm')}
        </p>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`status-${reminder.id}`}
            checked={reminder.isComplete}
            onCheckedChange={() => onToggleComplete(reminder.id, reminder.isComplete)}
            aria-label={`Mark reminder as ${reminder.isComplete ? 'incomplete' : 'complete'}`}
          />
          <Label htmlFor={`status-${reminder.id}`} className="text-sm font-medium cursor-pointer">
            {reminder.isComplete ? 'Completed' : 'Pending'}
          </Label>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(reminder)} aria-label="Edit reminder">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(reminder.id)} className="text-destructive hover:text-destructive" aria-label="Delete reminder">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
});
ReminderItem.displayName = 'ReminderItem';


export default function RemindersPage() {
  const {
    items: reminders,
    addItem: addReminderToDb,
    updateItem: updateReminderInDb,
    deleteItem: deleteReminderFromDb,
    loading: remindersLoading,
    error: remindersError
  } = useRtdbList<Reminder>('reminders');

  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const [instantSearchTerm, setInstantSearchTerm] = useState('');
  const searchTerm = useDebounce(instantSearchTerm, 300);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest'); // 'newest' by createdAt, or 'dueDateAsc', 'dueDateDesc'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  const filteredAndSortedReminders = useMemo(() => {
    let result = reminders;

    if (searchTerm) {
      result = result.filter(reminder =>
        reminder.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(reminder => (statusFilter === 'completed' ? reminder.isComplete : !reminder.isComplete));
    }
    
    result.sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortOrder === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortOrder === 'dueDateAsc') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else { // dueDateDesc
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      }
    });

    return result;
  }, [reminders, searchTerm, statusFilter, sortOrder]);

  const handleSaveReminder = useCallback(async (reminderData: Partial<Omit<Reminder, 'id' | 'createdAt' | 'isComplete'>>, id?: string) => {
    try {
      if (id) { // Editing
        await updateReminderInDb(id, reminderData);
        toast({ title: "Success!", description: "Reminder updated." });
      } else { // Adding new
        const newReminder: Omit<Reminder, 'id'> = {
          ...(reminderData as Required<typeof reminderData>), // all fields should be present
          isComplete: false,
          createdAt: new Date().toISOString(),
        };
        await addReminderToDb(newReminder);
        toast({ title: "Success!", description: "New reminder added." });
      }
      setIsFormOpen(false);
      setEditingReminder(null);
    } catch (e: any) {
      let description = "Failed to save reminder.";
      if (e?.message) description += ` Details: ${e.message.substring(0, 200)}`;
      toast({ title: "Database Error", description, variant: "destructive" });
      console.error("Failed to save reminder:", e);
    }
  }, [addReminderToDb, updateReminderInDb, toast]);

  const handleEditReminder = useCallback((reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsFormOpen(true);
  }, []);

  const handleToggleComplete = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      await updateReminderInDb(id, { isComplete: !currentStatus });
      toast({ title: "Updated!", description: `Reminder marked as ${!currentStatus ? 'complete' : 'pending'}.` });
    } catch (e: any) {
      let description = "Failed to update reminder status.";
      if (e?.message) description += ` Details: ${e.message.substring(0, 100)}`;
      toast({ title: "Database Error", description, variant: "destructive" });
      console.error("Failed to update reminder status:", e);
    }
  }, [updateReminderInDb, toast]);

  const handleDeleteReminder = useCallback(async (id: string) => {
    try {
      await deleteReminderFromDb(id);
      toast({ title: "Deleted!", description: "Reminder removed.", variant: "destructive" });
    } catch (e: any) {
      let description = "Failed to delete reminder.";
      if (e?.message) description += ` Details: ${e.message.substring(0, 100)}`;
      toast({ title: "Database Error", description, variant: "destructive" });
      console.error("Failed to delete reminder:", e);
    }
  }, [deleteReminderFromDb, toast]);


  if (!isClientLoaded || remindersLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading Reminders...</p>
      </div>
    );
  }

  if (remindersError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error loading reminders: {remindersError.message}.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reminders"
        description="Stay on top of your tasks and appointments."
        icon={CalendarClock}
        actions={
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingReminder(null); }}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
              <ReminderForm
                reminder={editingReminder || undefined}
                onSave={handleSaveReminder}
                onClose={() => { setIsFormOpen(false); setEditingReminder(null); }}
              />
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reminders..."
                value={instantSearchTerm}
                onChange={(e) => setInstantSearchTerm(e.target.value)}
                className="pl-8 w-full"
                aria-label="Search reminders"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | 'pending' | 'completed')}>
              <SelectTrigger className="w-full" aria-label="Filter by status">
                <Filter className="mr-2 h-4 w-4 inline-block" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as SortOrder | 'dueDateAsc' | 'dueDateDesc')}>
              <SelectTrigger className="w-full" aria-label="Sort by">
                <ArrowUpDown className="mr-2 h-4 w-4 inline-block" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dueDateAsc">Due Date (Asc)</SelectItem>
                <SelectItem value="dueDateDesc">Due Date (Desc)</SelectItem>
                <SelectItem value="newest">Created (Newest)</SelectItem>
                <SelectItem value="oldest">Created (Oldest)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {filteredAndSortedReminders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedReminders.map(reminder => (
            <ReminderItem
              key={reminder.id}
              reminder={reminder}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEditReminder}
              onDelete={handleDeleteReminder}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 rounded-lg bg-card border shadow-sm">
          <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-medium">No reminders yet!</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Click "Add Reminder" to get started.
          </p>
          <Dialog open={isFormOpen} onOpenChange={(isOpen) => { setIsFormOpen(isOpen); if (!isOpen) setEditingReminder(null); }}>
            <DialogTrigger asChild>
              <Button className="mt-4">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Reminder
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
               <ReminderForm
                reminder={editingReminder || undefined}
                onSave={handleSaveReminder}
                onClose={() => { setIsFormOpen(false); setEditingReminder(null); }}
              />
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
