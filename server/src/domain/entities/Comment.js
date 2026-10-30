export default class Comment {
  constructor({
    id,
    articleId,
    author,
    content,
    approved = false,
    createdAt = null,
    article = null,
  }) {
    // article : { title, slug } joint pour la modération (facultatif)
    Object.assign(this, { id, articleId, author, content, approved, createdAt, article });
  }

  isApproved() {
    return this.approved === true;
  }

  /** Vue publique : jamais l'identifiant de l'article ni les métadonnées de modération. */
  toPublic() {
    return {
      id: this.id,
      author: this.author,
      content: this.content,
      createdAt: this.createdAt,
    };
  }
}
