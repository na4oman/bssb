export type Post = {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdBy: {
    userId: string;
    userName: string;
  };
  createdAt: Date;
  updatedAt: Date;
  likes: string[]; // Array of user IDs who liked
  comments: PostComment[];
};

export type PostComment = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  imageUrl?: string;
  createdAt: Date;
};
