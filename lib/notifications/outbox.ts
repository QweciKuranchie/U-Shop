// lib/notifications/outbox.ts
// Compliance: U-Shop SRD v1.1 §9.2 & §3.0

import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import { EmailJobType } from "../../generated/prisma";
import * as Sentry from "@sentry/nextjs";

export const FROM_ADDRESS = "U-Shop <noreply@ushopgh.com>";

export interface EmailJobPayload {
  to: string;
  subject: string;
  jobType: EmailJobType;
  payload: Record<string, unknown>;
}

/**
 * Queue an email job in the database.
 */
export async function queueEmail(job: EmailJobPayload) {
  return prisma.emailOutbox.create({
    data: {
      to: job.to,
      subject: job.subject,
      jobType: job.jobType,
      payload: job.payload as any, // json typecast
      status: "PENDING",
      attempts: 0,
    },
  });
}

/**
 * Render standard HTML placeholders for each job type to fulfill outbox dispatching.
 */
function renderEmailBody(jobType: EmailJobType, payload: Record<string, unknown>): string {
  switch (jobType) {
    case "SELLER_OTP":
      return `<p>Your seller verification OTP is: <strong>${payload.otp}</strong></p>`;
    case "SELLER_APPROVED":
      return `<p>Congratulations! Your store <strong>${payload.storeName}</strong> has been approved. Access it at /store/${payload.handle}</p>`;
    case "SELLER_REJECTED":
      return `<p>Your seller profile application was rejected. Reason: ${payload.reason}</p>`;
    case "NEW_ORDER_SELLER":
      return `<p>You have a new order! Reference: <strong>${payload.ref}</strong>. Product: ${payload.productTitle}. Total Charged: GHS ${payload.totalCharged}</p>`;
    case "ORDER_CONFIRMED_BUYER":
      return `<p>Your order is confirmed! Reference: <strong>${payload.ref}</strong>. Total Charged: GHS ${payload.totalCharged}</p>`;
    case "DELIVERY_OTP_BUYER":
      return `<p>Your delivery verification OTP is: <strong>${payload.otp}</strong>. Order reference: ${payload.ref}</p>`;
    case "ORDER_DELIVERED":
      return `<p>Your order <strong>${payload.ref}</strong> has been successfully delivered!</p>`;
    case "PAYOUT_SENT":
      return `<p>Your payout of GHS ${payload.amount} has been sent. Mobile Money Reference: ${payload.momoRef}</p>`;
    case "REFUND_STARTED":
      return `<p>A refund has been initiated for your order <strong>${payload.ref}</strong>.</p>`;
    default:
      return `<p>Notification payload: ${JSON.stringify(payload)}</p>`;
  }
}

/**
 * Process pending/failed email jobs in the outbox.
 */
export async function processOutbox(): Promise<{ processed: number; failed: number }> {
  // Query all PENDING or FAILED jobs with < 5 attempts
  const jobs = await prisma.emailOutbox.findMany({
    where: {
      status: { in: ["PENDING", "FAILED"] },
      attempts: { lt: 5 },
    },
    orderBy: { createdAt: "asc" },
    take: 50, // Batch limit
  });

  let processedCount = 0;
  let failedCount = 0;

  for (const job of jobs) {
    const nextAttempts = job.attempts + 1;
    try {
      const html = renderEmailBody(job.jobType, job.payload as Record<string, unknown>);
      
      const { error } = await resend.emails.send({
        from: FROM_ADDRESS,
        to: job.to,
        subject: job.subject,
        html,
      });

      if (error) {
        throw error;
      }

      // Mark as SENT
      await prisma.emailOutbox.update({
        where: { id: job.id },
        data: {
          status: "SENT",
          attempts: nextAttempts,
          processedAt: new Date(),
          lastError: null,
        },
      });
      processedCount++;
    } catch (err: unknown) {
      failedCount++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      Sentry.captureException(err, {
        tags: { service: "email_outbox", jobType: job.jobType },
        extra: { jobId: job.id, attempts: nextAttempts, to: job.to },
      });

      await prisma.emailOutbox.update({
        where: { id: job.id },
        data: {
          status: "FAILED",
          attempts: nextAttempts,
          lastError: errorMessage,
        },
      });
    }
  }

  return { processed: processedCount, failed: failedCount };
}
