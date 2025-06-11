"use client";

import React, { useEffect, useState } from "react";
import { getCookie } from "cookies-next";
import UpdateAlert from "./UpdateAlert";

export function UpdateAlertProvider() {
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    // Check if the user has already dismissed the alert
    const alertDismissed = getCookie("update_alert");

    // Show alert if it hasn't been dismissed and we're not on the canary subdomain
    if (alertDismissed !== "false" && typeof window !== "undefined") {
      const isCanaryDomain = window.location.hostname.includes("canary");
      if (!isCanaryDomain) {
        setShowAlert(true);
      }
    }
  }, []);

  return <UpdateAlert open={showAlert} />;
}
