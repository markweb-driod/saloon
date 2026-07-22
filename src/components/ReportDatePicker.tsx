"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";

export default function ReportDatePicker({ date }: { date: string }) {
  const router = useRouter();
  return (
    <Input
      type="date"
      value={date}
      onChange={(e) => router.push(`/dashboard/reports?date=${e.target.value}`)}
      className="w-auto"
    />
  );
}
