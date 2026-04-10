


export class User {
  constructor(
    public id: string,
    public username: string,
    public email: string,
    public google_id?: string,
    public phone?: string,
    public password_hash?: string,
    public full_name?: string,
    public bio?: string,
    public avatar_url?: string,
    public location?: any, 
    public country?: string,
    public city?: string,
    public reputation_score: number = 5.0,
    public total_reviews: number = 0,
    public is_verified: boolean = false,
    public is_active: boolean = true,
    public created_at: Date = new Date(),
  ) {}
}