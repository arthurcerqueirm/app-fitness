"use client";

import { useParams } from "next/navigation";
import { WorkoutEditorComponent } from "@/components/workout/WorkoutEditorComponent";

export default function WorkoutEditorPage() {
  const { id } = useParams();
  return <WorkoutEditorComponent templateId={String(id)} />;
}
