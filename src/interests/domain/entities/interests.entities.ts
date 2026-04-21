
export const INTEREST_KAY = 'INTEREST_KAY'


export class Interests{
    constructor(
        public  id:number,
        public readonly name:string,
        public readonly icon?:string,
        public readonly color_hex?:string
    ){}
}