export class SummaryDocument {
  title: string;
  author: string;
  published: string;
  content: string;

  constructor(
    title: string,
    author: string,
    pubblished: string,
    content: string,
  ) {
    this.title = title;
    this.author = author;
    this.published = pubblished;
    this.content = content;
  }

  toJSON() {
    return JSON.stringify({
      title: this.title,
      author: this.author,
      published: this.published,
      content: this.content,
    });
  }
}
