import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface RecurringPostFormProps {
  isRecurring: boolean;
  onIsRecurringChange: (value: boolean) => void;
  recurrencePattern: string;
  onRecurrencePatternChange: (value: string) => void;
  recurrenceEndDate: Date | undefined;
  onRecurrenceEndDateChange: (value: Date | undefined) => void;
}

export const RecurringPostForm = ({
  isRecurring,
  onIsRecurringChange,
  recurrencePattern,
  onRecurrencePatternChange,
  recurrenceEndDate,
  onRecurrenceEndDateChange,
}: RecurringPostFormProps) => {
  return (
    <div className="space-y-4 p-4 rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="w-4 h-4 text-muted-foreground" />
          <Label htmlFor="recurring" className="font-medium">Wiederkehrender Post</Label>
        </div>
        <Switch
          id="recurring"
          checked={isRecurring}
          onCheckedChange={onIsRecurringChange}
        />
      </div>

      {isRecurring && (
        <div className="space-y-4 pt-2">
          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Wiederholung</Label>
            <Select value={recurrencePattern} onValueChange={onRecurrencePatternChange}>
              <SelectTrigger>
                <SelectValue placeholder="Häufigkeit wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Täglich</SelectItem>
                <SelectItem value="weekly">Wöchentlich</SelectItem>
                <SelectItem value="biweekly">Alle 2 Wochen</SelectItem>
                <SelectItem value="monthly">Monatlich</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm text-muted-foreground mb-2 block">Ende der Serie</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !recurrenceEndDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {recurrenceEndDate ? (
                    format(recurrenceEndDate, 'dd.MM.yyyy', { locale: de })
                  ) : (
                    'Enddatum wählen (optional)'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={recurrenceEndDate}
                  onSelect={onRecurrenceEndDateChange}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground mt-1">
              Ohne Enddatum wird der Post unbegrenzt wiederholt.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-primary/10 text-sm">
            <p className="font-medium mb-1">Vorschau der Serie:</p>
            <p className="text-muted-foreground">
              {recurrencePattern === 'daily' && 'Post wird jeden Tag zur gleichen Zeit veröffentlicht.'}
              {recurrencePattern === 'weekly' && 'Post wird jede Woche am gleichen Tag zur gleichen Zeit veröffentlicht.'}
              {recurrencePattern === 'biweekly' && 'Post wird alle 2 Wochen am gleichen Tag zur gleichen Zeit veröffentlicht.'}
              {recurrencePattern === 'monthly' && 'Post wird jeden Monat am gleichen Tag zur gleichen Zeit veröffentlicht.'}
              {!recurrencePattern && 'Wähle eine Häufigkeit aus.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
