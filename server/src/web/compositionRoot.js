import { createClient } from '@supabase/supabase-js';

export function buildContainer(config) {
  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false },
  });

  // const articleRepository = new ArticleRepository(supabase);
  // const articleService = new ArticleService(articleRepository);
  // const articleController = new ArticleController(articleService);

  return { supabase /*, articleController, errorHandler */ };
}