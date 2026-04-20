

export const USER_INTERESTS = "USER_INTERESTS"

export class UserInterests{
    constructor(
        public id:string,
        public user_id :string,
        public interest_id:string,
        public DateTime: Date,
    ){}
}