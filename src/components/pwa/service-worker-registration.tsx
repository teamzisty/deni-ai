"use client";

import { useEffect } from "react";

const SERVICE_WORKER_URL = "/sw.js";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    if (process.env.NODE_ENV !== "production") {
      void unregisterServiceWorkers();
      return;
    }

    void registerServiceWorker();
  }, []);

  return null;
}

async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
      scope: "/",
    });

    void registration.update();
  } catch (error) {
    console.error("Failed to register service worker.", error);
  }
}

async function unregisterServiceWorkers() {
  const registrations = await navigator.serviceWorker.getRegistrations();

  await Promise.all(registrations.map((registration) => registration.unregister()));
}
