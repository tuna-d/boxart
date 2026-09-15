"use client";

import { useEffect } from "react";
import { markNotificationsRead } from "@/app/follows/actions";

/** Marks notifications read once the page has shown them, so the new ones still stand out first. */
export function MarkNotificationsRead() {
  useEffect(() => {
    void markNotificationsRead();
  }, []);
  return null;
}
