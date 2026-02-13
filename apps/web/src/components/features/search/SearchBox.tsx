'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface SearchBoxProps {
    initialValue?: string;
    onSearch?: (value: string) => void; // Optional: for in-page search
}

export function SearchBox({ initialValue = '', onSearch }: SearchBoxProps) {
    const [query, setQuery] = useState(initialValue);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        if (onSearch) {
            onSearch(query);
        } else {
            router.push(`/search?q=${encodeURIComponent(query)}`);
        }
    };

    return (
        <Card className="p-2 w-full max-w-2xl mx-auto border-none !bg-transparent !shadow-none !backdrop-blur-none">
            <form onSubmit={handleSubmit} className="flex gap-2 relative">
                <div className="flex-1 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-sky-500/30 rounded-xl blur-md opacity-20 group-hover:opacity-60 transition duration-500"></div>
                    <Input
                        className="relative !bg-white/5 !border-white/5 !text-white !placeholder-white/20 !text-sm !py-3 !px-5 !rounded-lg backdrop-blur-sm focus:!bg-white/10 transition-all font-light text-center"
                        placeholder="Search corpus..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <Button type="submit" size="sm" className="!rounded-lg !px-4 text-sm font-medium shadow-lg shadow-indigo-500/20 absolute right-1 top-1 bottom-1">
                    Search
                </Button>
            </form>
        </Card>
    );
}
