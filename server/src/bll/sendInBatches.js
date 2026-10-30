import { chunk } from '../shared/html.js';

/** Envoie par lots pour respecter les limites du fournisseur, et compte le résultat. */
export async function sendInBatches(emailClient, receivers, batchSize, buildMail) {
  let sent = 0;
  let failed = 0;
  for (const batch of chunk(receivers, batchSize)) {
    const results = await Promise.allSettled(
      batch.map((s) => emailClient.send({ to: s.email, ...buildMail(s) }))
    );
    sent += results.filter((r) => r.status === 'fulfilled').length;
    failed += results.filter((r) => r.status === 'rejected').length;
  }
  return { sent, failed };
}
