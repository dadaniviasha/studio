
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import type { Bet, ColorOption, NumberOption } from '@/lib/types';

// Dummy data for bets - in a real app, this would come from a backend or shared state
const dummyBets: Bet[] = [
  { id: 'bet001', userId: 'user123', roundId: 'round777', selectedColor: 'RED', selectedNumber: null, amount: 100, timestamp: Date.now() - 5000 },
  { id: 'bet002', userId: 'user456', roundId: 'round777', selectedColor: null, selectedNumber: 7, amount: 50, timestamp: Date.now() - 10000 },
  { id: 'bet003', userId: 'user123', roundId: 'round777', selectedColor: 'GREEN', selectedNumber: null, amount: 200, timestamp: Date.now() - 15000 },
  { id: 'bet004', userId: 'user789', roundId: 'round777', selectedColor: 'VIOLET', selectedNumber: null, amount: 20, timestamp: Date.now() - 20000 },
  { id: 'bet005', userId: 'userXYZ', roundId: 'round777', selectedColor: null, selectedNumber: 0, amount: 500, timestamp: Date.now() - 25000 },
];

export function CurrentBetsOverview() {

  const getBetDescription = (bet: Bet): string => {
    if (bet.selectedColor) return `Color: ${bet.selectedColor}`;
    if (bet.selectedNumber !== null) return `Number: ${bet.selectedNumber}`;
    return "Unknown Bet";
  };

  return (
    <Card className="shadow-xl bg-card/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-headline text-primary">
          <Eye className="mr-2 h-6 w-6" /> Current Round Bets (Example)
        </CardTitle>
        <CardDescription>
          Overview of bets placed in the current/most recent round. (This is a static example for prototype purposes).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {dummyBets.length > 0 ? (
          <ScrollArea className="h-[300px] w-full border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bet ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Selection</TableHead>
                  <TableHead className="text-right">Amount (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dummyBets.map((bet) => (
                  <TableRow key={bet.id}>
                    <TableCell className="font-mono text-xs">{bet.id.slice(-6)}</TableCell>
                    <TableCell>{bet.userId}</TableCell>
                    <TableCell>
                      <Badge variant={bet.selectedColor ? "default" : "secondary"} 
                             className={
                                bet.selectedColor === 'RED' ? 'bg-red-500' :
                                bet.selectedColor === 'GREEN' ? 'bg-green-500' :
                                bet.selectedColor === 'VIOLET' ? 'bg-purple-500' :
                                bet.selectedNumber !== null ? 'bg-gray-500' : '' // For number type, or default
                             }>
                        {getBetDescription(bet)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">₹{bet.amount.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No bet data to display (Example).</p>
        )}
      </CardContent>
    </Card>
  );
}
