// DTO to format and clean raw DB output to JSON for US B-02

class CommentDTO {
  constructor(data = {}) {
    const { comment_id, case_id, content, time_sent, user = null } = data || {};

    this.commentId = comment_id ?? null;
    this.caseId = case_id ?? null;
    this.content = content ?? null;
    this.timeSent = time_sent ? new Date(time_sent) : null;

    this.author = {
      userId: user?.user_id ?? null,
      name: user?.name ?? null,
      lastName: user?.last_name ?? null,
    };
  }

  toJSON() {
    return {
      commentId: this.commentId,
      caseId: this.caseId,
      content: this.content,
      timeSent: this.timeSent,
      author: this.author,
    };
  }
}

export default CommentDTO;
