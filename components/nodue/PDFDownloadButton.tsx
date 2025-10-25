"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Loader2,
  ExternalLink,
  CheckCircle,
  Copy,
} from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Browser } from "@capacitor/browser";
import { FileOpener } from "@capacitor-community/file-opener";

interface PDFDownloadButtonProps {
  studentId: string;
  studentName: string;
  registerNumber: string;
  canDownload: boolean;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onDownloadError?: (error: string) => void;
}

export function PDFDownloadButton({
  studentId,
  studentName,
  registerNumber,
  canDownload,
  onDownloadStart,
  onDownloadComplete,
  onDownloadError,
}: PDFDownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);

  // Check if certificate already exists
  useEffect(() => {
    checkExistingCertificate();
  }, [studentId]);

  const checkExistingCertificate = async () => {
    try {
      setCheckingExisting(true);
      const response = await fetch("/api/nodue/check-existing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.pdf_url) {
          setExistingPdfUrl(data.pdf_url);
        }
      }
    } catch (error) {
      console.error("Error checking existing certificate:", error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const requestNotificationPermission = async () => {
    if (!Capacitor.isNativePlatform()) return true;

    try {
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display === "granted") return true;

      const request = await LocalNotifications.requestPermissions();
      return request.display === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  };

  const showNotification = async (
    title: string,
    body: string,
    id: number = 1,
    actionData?: { fileUri?: string; pdfUrl?: string },
    withAction: boolean = false
  ) => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) return;

      const notification: any = {
        title,
        body,
        id,
        schedule: { at: new Date(Date.now() + 100) },
        extra: actionData,
        actionTypeId: withAction ? "OPEN_PDF" : undefined,
      };

      await LocalNotifications.schedule({
        notifications: [notification],
      });
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  };

  // Listen for notification taps
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let actionListener: any;
    let receivedListener: any;

    const setupListeners = async () => {
      // Listen for notification tap (when user taps the notification body)
      actionListener = await LocalNotifications.addListener(
        "localNotificationActionPerformed",
        async (notification) => {
          console.log("Notification action performed:", notification);
          const extra = notification.notification.extra;

          // Always prefer opening in browser for better UX
          if (extra?.pdfUrl) {
            await Browser.open({
              url: extra.pdfUrl,
              presentationStyle: "fullscreen",
            });
          } else if (extra?.fileUri) {
            // Try to open the file
            try {
              await FileOpener.open({
                filePath: extra.fileUri,
                contentType: "application/pdf",
              });
            } catch (error) {
              console.error("Error opening file from notification:", error);
            }
          }
        }
      );

      // Also listen for when notification is received/tapped
      receivedListener = await LocalNotifications.addListener(
        "localNotificationReceived",
        async (notification) => {
          console.log("Notification received:", notification);
        }
      );
    };

    setupListeners();

    return () => {
      if (actionListener) {
        actionListener.remove();
      }
      if (receivedListener) {
        receivedListener.remove();
      }
    };
  }, []);

  const downloadToMobile = async (pdfUrl: string, fileName: string) => {
    if (!Capacitor.isNativePlatform()) {
      // Web/PWA: open in new tab
      window.open(pdfUrl, "_blank");
      return;
    }

    try {
      // Show downloading notification
      await showNotification(
        "Downloading Certificate",
        "Your No Due Certificate is being downloaded...",
        1,
        { pdfUrl } // Pass URL so notification can open it
      );

      // Fetch the PDF
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const base64 = await blobToBase64(blob);

      // Save to device
      const result = await Filesystem.writeFile({
        path: `NoDue/${fileName}`,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      });

      console.log("File saved to:", result.uri);

      // Show success notification with file URI and PDF URL
      await showNotification(
        "Download Complete",
        `Tap to open ${fileName}`,
        2,
        { fileUri: result.uri, pdfUrl }, // Pass both file URI and URL
        true // Enable action button
      );

      // Automatically open the PDF in external app
      try {
        await FileOpener.open({
          filePath: result.uri,
          contentType: "application/pdf",
        });
      } catch (openError) {
        console.error("Error opening PDF:", openError);
        // Fallback: open URL in browser
        await Browser.open({ url: pdfUrl });
      }

      return result.uri;
    } catch (error) {
      console.error("Error downloading to mobile:", error);
      await showNotification(
        "Download Failed",
        "Failed to download certificate. Please try again.",
        3
      );
      throw error;
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleGenerate = async () => {
    if (!canDownload || loading) return;

    try {
      setLoading(true);
      onDownloadStart?.();

      const fileName = `NoDue_${registerNumber}.pdf`;

      const response = await fetch("/api/nodue/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          fileName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate PDF");
      }

      const data = await response.json();

      if (data.pdf_url) {
        // PDF was uploaded to Cloudinary
        setExistingPdfUrl(data.pdf_url);

        // Download to mobile or open in browser
        await downloadToMobile(data.pdf_url, fileName);

        onDownloadComplete?.();
      } else {
        throw new Error("No PDF URL returned");
      }
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      onDownloadError?.(error.message || "Failed to generate certificate");
      alert("Failed to generate certificate: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewExisting = async () => {
    if (!existingPdfUrl) return;

    try {
      if (Capacitor.isNativePlatform()) {
        // On native: Open in external browser/PDF viewer
        await Browser.open({ url: existingPdfUrl });
      } else {
        // On web: Open in new tab
        window.open(existingPdfUrl, "_blank");
      }
    } catch (error: any) {
      console.error("Error viewing PDF:", error);
      alert("Failed to open certificate: " + error.message);
    }
  };

  if (checkingExisting) {
    return (
      <button
        disabled
        className="w-full saas-button-primary opacity-50 cursor-not-allowed"
      >
        <span>Checking...</span>
      </button>
    );
  }

  const handleCopyLink = async () => {
    if (!existingPdfUrl) return;

    try {
      await navigator.clipboard.writeText(existingPdfUrl);
      alert("Certificate link copied to clipboard!");
    } catch (error) {
      console.error("Error copying link:", error);
      alert("Failed to copy link");
    }
  };

  // If certificate already exists, show view button
  if (existingPdfUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg border border-green-200">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">
            Certificate Already Generated
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleViewExisting}
            className="flex-[80] saas-button-primary flex items-center justify-center space-x-2"
          >
            <ExternalLink className="w-5 h-5" />
            <span>View Certificate</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="flex-[15] saas-button-primary flex items-center justify-center"
            title="Copy certificate link"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Show generate button
  return (
    <button
      onClick={handleGenerate}
      disabled={!canDownload || loading}
      className={`w-full saas-button-primary flex items-center justify-center space-x-2 ${
        !canDownload || loading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      {loading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Generating...</span>
        </>
      ) : (
        <>
          <Download className="w-5 h-5" />
          <span>Generate Certificate</span>
        </>
      )}
    </button>
  );
}
