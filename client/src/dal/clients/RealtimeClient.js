/** Écoute des insertions Supabase Realtime. Les RLS filtrent ce que chacun reçoit. */
export default class RealtimeClient {
  constructor(supabase) {
    this.supabase = supabase;
    this.count = 0;
  }

  /** Appelle callback(ligne) à chaque insertion ; renvoie la fonction de désabonnement. */
  onInsert(table, callback) {
    this.count += 1;
    const channel = this.supabase
      .channel(`pf-${table}-${this.count}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) =>
        callback(payload.new)
      )
      .subscribe();
    return () => this.supabase.removeChannel(channel);
  }
}
