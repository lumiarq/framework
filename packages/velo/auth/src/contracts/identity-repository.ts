/**
 * Identity repository contract.
 * Implement this interface in your application's database layer.
 */
export interface Identity {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIdentityData {
  email: string;
  passwordHash: string;
}

export interface IIdentityRepository {
  findByEmail(email: string): Promise<Identity | null>;
  findById(id: string): Promise<Identity | null>;
  create(data: CreateIdentityData): Promise<Identity>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}
