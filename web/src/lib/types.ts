/** Shape returned by the API and pushed over Socket.IO (see api ObjectView). */
export interface CollectionObject {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  createdAt: string;
}
