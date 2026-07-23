export interface ReviewDTO {
  id: string;
  reviewerId: string;
  revieweeId: string;
  itemId: string;
  matchId: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CreateReviewInput {
  matchId: string;
  rating: number;
  comment?: string;
}
