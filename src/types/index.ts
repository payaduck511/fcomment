export interface UserInfo {
  nickname: string;
}

export interface CommentItem {
  nickname: string;
  displayName: string;
  sourceType?: 'job' | 'character' | string;
  content: string;
  createdAt: string;
  likes?: number;
}
