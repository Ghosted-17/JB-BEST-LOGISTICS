import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import type { DocumentReference } from 'firebase-admin/firestore';

/**
 * Paystack Webhook Route Handler for JB & Best Logistics LLC
 * Endpoint: POST /api/paystack/webhook
 * 
 * Verifies the cryptographic HMAC SHA512 signature sent in the 'x-paystack-signature' header.
 * Upon successful payment validation ('charge.success'), updates the corresponding Invoice status
 * to 'paid' in Cloud Firestore via the Firebase Admin SDK.
 */
export async function POST(req: NextRequest) {
  try {
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

    if (!paystackSecret) {
      console.error('PAYSTACK_SECRET_KEY environment variable is missing.');
      return NextResponse.json(
        { error: 'Server configuration error: Paystack secret is not configured' },
        { status: 500 }
      );
    }

    // 1. Extract Paystack cryptographic signature header
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      console.warn('Paystack webhook received without x-paystack-signature header.');
      return NextResponse.json(
        { error: 'Missing x-paystack-signature header' },
        { status: 400 }
      );
    }

    // 2. Read the RAW body string to compute the HMAC hash
    const rawBody = await req.text();

    // 3. Compute HMAC SHA512 using the secret key
    const computedHash = crypto
      .createHmac('sha512', paystackSecret)
      .update(rawBody)
      .digest('hex');

    // 4. Secure timing-safe signature comparison
    const isValidSignature =
      signature.length === computedHash.length &&
      crypto.timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(computedHash, 'utf8'));

    if (!isValidSignature) {
      console.warn('Paystack webhook signature verification failed.');
      return NextResponse.json(
        { error: 'Invalid HMAC signature' },
        { status: 401 }
      );
    }

    // 5. Parse the webhook event payload
    const eventPayload = JSON.parse(rawBody);
    const { event, data } = eventPayload;

    console.log(`[Paystack Webhook] Verified event received: ${event}`, {
      reference: data?.reference,
      amount: data?.amount,
      customerEmail: data?.customer?.email,
    });

    // 6. Handle successful charge event
    if (event === 'charge.success') {
      const reference = data.reference;
      const metadata = data.metadata || {};
      const invoiceId = metadata.invoiceId || metadata.custom_fields?.find((f: any) => f.variable_name === 'invoice_id')?.value;
      const paidAt = data.paid_at || new Date().toISOString();

      let targetInvoiceRef: DocumentReference | null = null;

      // Identify target invoice document in Firestore
      if (invoiceId) {
        targetInvoiceRef = adminDb.collection('invoices').doc(invoiceId);
      } else {
        // Query by payment reference or invoice number
        const snapshot = await adminDb
          .collection('invoices')
          .where('paymentReference', '==', reference)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          targetInvoiceRef = snapshot.docs[0].ref;
        } else {
          // Check by invoiceNumber matching reference
          const numSnapshot = await adminDb
            .collection('invoices')
            .where('invoiceNumber', '==', reference)
            .limit(1)
            .get();

          if (!numSnapshot.empty) {
            targetInvoiceRef = numSnapshot.docs[0].ref;
          }
        }
      }

      if (targetInvoiceRef) {
        // Atomic Firestore update with audit log
        await targetInvoiceRef.update({
          status: 'paid',
          paidAt: paidAt,
          paymentGateway: 'paystack',
          paymentReference: reference,
          paystackTransactionId: data.id,
          amountPaid: data.amount / 100, // Convert from kobo/cents to standard units
          currency: data.currency || 'USD',
          updatedAt: new Date().toISOString(),
        });

        console.log(`[Paystack Webhook] Successfully updated Invoice ${targetInvoiceRef.id} to PAID`);
      } else {
        console.warn(`[Paystack Webhook] No matching invoice found for reference ${reference}. Logging unassigned payment.`);
        // Store in unassigned_payments collection for associate review
        await adminDb.collection('unassigned_payments').add({
          gateway: 'paystack',
          reference,
          amount: data.amount / 100,
          currency: data.currency,
          customerEmail: data.customer?.email,
          rawPayload: data,
          receivedAt: new Date().toISOString(),
        });
      }
    }

    // Always acknowledge receipt promptly to Paystack with 200 OK
    return NextResponse.json({
      status: 'success',
      message: 'Paystack event processed successfully',
    });
  } catch (error: any) {
    console.error('Error processing Paystack webhook:', error);
    return NextResponse.json(
      { error: 'Internal Server Error while handling webhook', details: error.message },
      { status: 500 }
    );
  }
}
